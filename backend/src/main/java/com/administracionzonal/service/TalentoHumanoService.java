package com.administracionzonal.service;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.administracionzonal.dto.CrearUsuarioDTO;
import com.administracionzonal.dto.UsuarioDocumentoDTO;
import com.administracionzonal.entity.Auditoria;
import com.administracionzonal.entity.ChecklistDetalle;
import com.administracionzonal.entity.DocumentoTipo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.UsuarioDocumento;
import com.administracionzonal.entity.UsuarioProceso;
import com.administracionzonal.enums.EstadoDocumento;
import com.administracionzonal.enums.TipoProceso;
import com.administracionzonal.repository.AuditoriaRepository;
import com.administracionzonal.repository.ChecklistDetalleRepository;
import com.administracionzonal.repository.DocumentoTipoRepository;
import com.administracionzonal.repository.UsuarioDocumentoRepository;
import com.administracionzonal.repository.UsuarioProcesoRepository;
import com.administracionzonal.repository.UsuarioRepository;

@Service
public class TalentoHumanoService {

    private final DocumentoTipoRepository documentoTipoRepo;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioProcesoRepository procesoRepo;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioDocumentoRepository documentoRepo;
    private final ChecklistDetalleRepository checklistRepo;
    private final AuditoriaRepository auditoriaRepo;
    private final JdbcTemplate jdbc;

    public TalentoHumanoService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            UsuarioProcesoRepository procesoRepo,
            UsuarioDocumentoRepository documentoRepo,
            ChecklistDetalleRepository checklistRepo,
            AuditoriaRepository auditoriaRepo,
            JdbcTemplate jdbc,
            DocumentoTipoRepository documentoTipoRepo) {

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.procesoRepo = procesoRepo;
        this.documentoRepo = documentoRepo;
        this.checklistRepo = checklistRepo;
        this.auditoriaRepo = auditoriaRepo;
        this.jdbc = jdbc;
        this.documentoTipoRepo = documentoTipoRepo;
    }

    // ==========================
    // AUDITORÍA
    // ==========================
    private void auditoria(Long idUsuario, String accion, String detalle) {
        Auditoria a = new Auditoria();
        a.setIdUsuario(idUsuario);
        a.setAccion(accion);
        a.setDetalle(detalle);
        a.setFecha(LocalDateTime.now());
        auditoriaRepo.save(a);
    }

    // ==========================
    // SUBIR DOCUMENTO
    // ==========================
    public UsuarioDocumento subirDocumento(Long idUsuario,
            Long idDocumentoTipo,
            MultipartFile file) throws Exception {

        if (idUsuario == null || idDocumentoTipo == null) {
            throw new RuntimeException("Datos inválidos");
        }

        DocumentoTipo tipo = documentoTipoRepo.findById(idDocumentoTipo)
                .orElseThrow(() -> new RuntimeException("Documento tipo no encontrado"));
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        String cedula = usuario.getCedula();
        // 📁 RUTA DENTRO DEL PROYECTO
        String rootPath = System.getProperty("user.dir");
        String carpeta = rootPath + "/uploads/" + cedula;

        File dir = new File(carpeta);
        if (!dir.exists()) {
            boolean creado = dir.mkdirs();
            if (!creado) {
                throw new RuntimeException("No se pudo crear carpeta: " + carpeta);
            }
        }

        // 📄 NOMBRE ARCHIVO
        String nombreArchivo = tipo.getNombre().replaceAll("\\s+", "_") + ".pdf";

        File destino = new File(dir, nombreArchivo);

        file.transferTo(destino);

        String ruta = destino.getAbsolutePath();

        // 🔍 BUSCAR SI EXISTE
        Optional<UsuarioDocumento> existente = documentoRepo.findByIdUsuarioAndDocumentoTipo_IdDocumentoTipo(
                idUsuario, idDocumentoTipo);

        UsuarioDocumento doc;

        if (existente.isPresent()) {
            doc = existente.get();
            doc.setRutaArchivo(ruta);

        } else {
            doc = new UsuarioDocumento();
            doc.setIdUsuario(idUsuario);
            doc.setDocumentoTipo(tipo);
            doc.setRutaArchivo(ruta);

        }

        return documentoRepo.save(doc);
    }

    // ==========================
    // CAMBIAR ESTADO DOCUMENTO
    // ==========================
    public UsuarioDocumento cambiarEstadoDocumento(Long id, EstadoDocumento estado) {

        if (id == null) {
            throw new RuntimeException("id no puede ser null");
        }
        UsuarioDocumento doc = documentoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        doc.setEstado(estado.name());

        return documentoRepo.save(doc);
    }

    // ==========================
    // VALIDAR CHECKLIST
    // ==========================
    public boolean validarChecklist(Long idUsuario, Long idChecklist) {

        List<ChecklistDetalle> requisitos = checklistRepo.findByIdChecklist(idChecklist);
        List<UsuarioDocumento> docs = documentoRepo.findByIdUsuario(idUsuario);

        for (ChecklistDetalle req : requisitos) {

            boolean existe = docs.stream()
                    .anyMatch(d -> d.getDocumentoTipo().getIdDocumentoTipo()
                            .equals(req.getIdDocumentoTipo()));

            if (Boolean.TRUE.equals(req.getObligatorio()) && !existe) {
                return false;
            }
        }

        return true;
    }

    // ==========================
    // FINALIZAR PROCESO
    // ==========================
    public void finalizarProceso(Long idUsuario, Long idChecklist, TipoProceso tipo) {

        if (!validarChecklist(idUsuario, idChecklist)) {
            throw new RuntimeException("Checklist incompleto");
        }

        UsuarioProceso proceso = procesoRepo.findByIdUsuario(idUsuario)
                .stream()
                .reduce((first, second) -> second)
                .orElseThrow();

        proceso.setEstado("COMPLETADO");
        proceso.setFechaFin(LocalDateTime.now());
        procesoRepo.save(proceso);

        boolean activo = tipo == TipoProceso.INGRESO;

        jdbc.update(
                "UPDATE administracionzonal.usuarios_institucion SET activo = ? WHERE id_usuario = ?",
                activo,
                idUsuario);

        auditoria(idUsuario, "FINALIZAR_PROCESO", tipo.name());
    }

    // ==========================
    // CREAR USUARIO TH
    // ==========================
    public Usuario crearOActivarUsuario(CrearUsuarioDTO dto) {

        Optional<Usuario> usuarioOpt = usuarioRepository.findByCedula(dto.getCedula());

        Usuario usuario;

        if (usuarioOpt.isPresent()) {
            usuario = usuarioOpt.get();
            if (documentoRepo.findByIdUsuario(usuario.getIdUsuario()).isEmpty()) {
                crearDocumentosIniciales(usuario.getIdUsuario());
            }
        } else {

            usuario = new Usuario();
            usuario.setCedula(dto.getCedula());
            usuario.setNombres(dto.getNombres());
            usuario.setCorreo(dto.getCedula() + "@quito.gob.ec");
            usuario.setPassword(passwordEncoder.encode("Quito2026"));
            usuario.setDebeCambiarPassword(true);
            usuario.setAceptaAcuerdo(false);
            usuario.setInstitucion("ADMINISTRACIÓN ZONAL VALLE DE LOS CHILLOS");
            usuario.setTipoUsuario("SERVIDOR_AZVCH");

            usuario = usuarioRepository.save(usuario);

            crearDocumentosIniciales(usuario.getIdUsuario());

            jdbc.update("""
                        INSERT INTO administracionzonal.usuarios_institucion (id_usuario, activo)
                        VALUES (?, true)
                        ON CONFLICT (id_usuario) DO UPDATE SET activo = true
                    """, usuario.getIdUsuario());

            jdbc.update("""
                        INSERT INTO administracionzonal.usuarios_roles (id_usuario, id_rol)
                        VALUES (?, 5)
                        ON CONFLICT DO NOTHING
                    """, usuario.getIdUsuario());
        }

        UsuarioProceso proceso = new UsuarioProceso();
        proceso.setIdUsuario(usuario.getIdUsuario());
        proceso.setTipo("INGRESO");
        proceso.setEstado("EN_PROCESO");
        proceso.setFechaInicio(LocalDateTime.now());

        procesoRepo.save(proceso);

        return usuario;
    }

    // ==========================
    // PROCESO PENDIENTE
    // ==========================
    public boolean tieneProcesoPendiente(Long idUsuario) {
        return procesoRepo.findByIdUsuario(idUsuario)
                .stream()
                .anyMatch(p -> "EN_PROCESO".equals(p.getEstado()));
    }

    // ==========================
    // LISTAR DOCUMENTOS
    // ==========================
    public List<UsuarioDocumentoDTO> getDocumentos(Long idUsuario) {

        List<UsuarioDocumento> docs = documentoRepo.findByIdUsuario(idUsuario);

        return docs.stream().map(doc -> new UsuarioDocumentoDTO(
                doc.getId(), // 🔥 ID ÚNICO (clave para React)
                doc.getDocumentoTipo().getIdDocumentoTipo(),
                doc.getDocumentoTipo().getNombre(),
                doc.getEstado(),
                "INGRESO",
                doc.getRutaArchivo() // 🔥 CLAVE
        )).toList();
    }

    public void crearDocumentosIniciales(Long idUsuario) {

        List<DocumentoTipo> tipos = documentoTipoRepo.findAll();

        for (DocumentoTipo tipo : tipos) {

            Optional<UsuarioDocumento> existente = documentoRepo.findByIdUsuarioAndDocumentoTipo_IdDocumentoTipo(
                    idUsuario, tipo.getIdDocumentoTipo()); // ✅ CORRECTO

            // 🔥 SOLO CREAR SI NO EXISTE
            if (existente.isEmpty()) {

                UsuarioDocumento doc = new UsuarioDocumento();
                doc.setIdUsuario(idUsuario);
                doc.setDocumentoTipo(tipo);
                doc.setEstado("PENDIENTE");

                documentoRepo.save(doc);
            }
        }
    }
}