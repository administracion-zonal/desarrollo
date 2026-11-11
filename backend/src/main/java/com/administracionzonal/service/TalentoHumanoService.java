package com.administracionzonal.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;
import java.text.Normalizer;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.dto.AltaUsuarioResponseDTO;
import com.administracionzonal.dto.ChecklistConfiguracionDTO;
import com.administracionzonal.dto.ConsultaUsuarioTHDTO;
import com.administracionzonal.dto.DocumentoTipoTHDTO;
import com.administracionzonal.dto.EstadoLaboralDTO;
import com.administracionzonal.dto.CrearUsuarioDTO;
import com.administracionzonal.dto.ProcesoUsuarioDTO;
import com.administracionzonal.dto.UsuarioDocumentoDTO;
import com.administracionzonal.entity.Auditoria;
import com.administracionzonal.entity.ChecklistDetalle;
import com.administracionzonal.entity.DocumentoTipo;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.UsuarioDocumento;
import com.administracionzonal.entity.UsuarioProceso;
import com.administracionzonal.enums.EstadoDocumento;
import com.administracionzonal.enums.TipoProceso;
import com.administracionzonal.repository.AuditoriaRepository;
import com.administracionzonal.repository.ChecklistDetalleRepository;
import com.administracionzonal.repository.DocumentoTipoRepository;
import com.administracionzonal.repository.RolRepository;
import com.administracionzonal.repository.UsuarioDocumentoRepository;
import com.administracionzonal.repository.UsuarioProcesoRepository;
import com.administracionzonal.repository.UsuarioRepository;

@Service
public class TalentoHumanoService {

    private static final SecureRandom GENERADOR_CLAVE = new SecureRandom();
    private static final String CARACTERES_CLAVE =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    private static final Map<String, String> DOCUMENTOS_CON_PLANTILLA = Map.of(
            normalizarNombreDocumento("Formulario de no tener parentesco con la autoridad nominadora"), "docx",
            normalizarNombreDocumento("Convenio de confidencialidad"), "docx",
            normalizarNombreDocumento("Solicitud de acumulación de décima tercera y décima cuarta remuneración"),
            "docx",
            normalizarNombreDocumento(
                    "Certificación de trabajador sustituto emitido por el Ministerio de Trabajo"), "docx",
            normalizarNombreDocumento("Certificación de operador del Sistema de Compras Públicas (SERCOP)"), "docx",
            normalizarNombreDocumento("Formulario 107 y proyección de gastos personales (si corresponde)"), "xlsx",
            normalizarNombreDocumento("Convenio antisoborno"), "docx");

    private final DocumentoTipoRepository documentoTipoRepo;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioProcesoRepository procesoRepo;
    private final PasswordEncoder passwordEncoder;
    private final UsuarioDocumentoRepository documentoRepo;
    private final ChecklistDetalleRepository checklistRepo;
    private final AuditoriaRepository auditoriaRepo;
    private final JdbcTemplate jdbc;
    private final RolRepository rolRepo;

    @Value("${TH_INITIAL_PASSWORD:}")
    private String claveInicialServidor;

    public TalentoHumanoService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            UsuarioProcesoRepository procesoRepo,
            UsuarioDocumentoRepository documentoRepo,
            ChecklistDetalleRepository checklistRepo,
            AuditoriaRepository auditoriaRepo,
            JdbcTemplate jdbc,
            DocumentoTipoRepository documentoTipoRepo,
            RolRepository rolRepo) {

        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.procesoRepo = procesoRepo;
        this.documentoRepo = documentoRepo;
        this.checklistRepo = checklistRepo;
        this.auditoriaRepo = auditoriaRepo;
        this.jdbc = jdbc;
        this.documentoTipoRepo = documentoTipoRepo;
        this.rolRepo = rolRepo;
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
    @Transactional
    public UsuarioDocumento subirDocumento(Long idUsuario,
            Long idDocumentoTipo,
            MultipartFile file) throws IOException {

        if (idUsuario == null || idDocumentoTipo == null || file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario, tipo y archivo son obligatorios");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo supera el límite de 10 MB");
        }
        String extension = validarArchivo(file);

        DocumentoTipo tipo = documentoTipoRepo.findById(idDocumentoTipo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento tipo no encontrado"));
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        String procesoTipo = tipo.getTipoProceso() == null ? "" : tipo.getTipoProceso().toUpperCase();
        boolean procesoAbierto = procesoRepo.findByIdUsuarioAndTipoAndEstado(
                        idUsuario, procesoTipo, "EN_PROCESO")
                .stream()
                .filter(proceso -> proceso.getIdChecklist() != null)
                .anyMatch(proceso -> checklistRepo.findByIdChecklist(proceso.getIdChecklist()).stream()
                        .anyMatch(requisito -> requisito.getIdDocumentoTipo().equals(idDocumentoTipo)));
        if (!procesoAbierto) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay un proceso activo para este documento");
        }

        Path root = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();
        Path carpeta = root.resolve(String.valueOf(idUsuario)).normalize();
        Path destino = carpeta.resolve(idDocumentoTipo + "-" + UUID.randomUUID() + "." + extension).normalize();
        if (!carpeta.startsWith(root) || !destino.startsWith(carpeta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo no permitida");
        }
        Files.createDirectories(carpeta);
        file.transferTo(destino.toFile());

        Optional<UsuarioDocumento> existente = documentoRepo.findByIdUsuarioAndDocumentoTipo_IdDocumentoTipo(
                idUsuario, idDocumentoTipo);

        UsuarioDocumento doc;

        if (existente.isPresent()) {
            doc = existente.get();
            doc.setRutaArchivo(destino.toString());
        } else {
            doc = new UsuarioDocumento();
            doc.setIdUsuario(idUsuario);
            doc.setDocumentoTipo(tipo);
            doc.setRutaArchivo(destino.toString());
        }

        doc.setEstado(EstadoDocumento.PENDIENTE.name());
        doc.setObservacionRevision(null);
        UsuarioDocumento guardado = documentoRepo.save(doc);
        auditoria(idUsuario, "DOCUMENTO_SUBIDO", "Tipo de documento " + idDocumentoTipo);
        return guardado;
    }

    @Transactional
    public DocumentoTipo subirPlantilla(Long idDocumentoTipo, MultipartFile file, String cedulaRevisor)
            throws IOException {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleccione un formato para cargar");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El formato supera el límite de 10 MB");
        }

        String extension = validarArchivo(file);
        DocumentoTipo tipo = documentoTipoRepo.findById(idDocumentoTipo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento tipo no encontrado"));
        String extensionEsperada = DOCUMENTOS_CON_PLANTILLA.get(normalizarNombreDocumento(tipo.getNombre()));
        if (extensionEsperada == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Solo se pueden cargar los siete formatos autorizados de Talento Humano");
        }
        if (!extensionEsperada.equals(extension)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Este formato debe cargarse como archivo ." + extensionEsperada);
        }
        Path root = Paths.get(System.getProperty("user.dir"), "uploads", "plantillas-th")
                .toAbsolutePath().normalize();
        Path carpeta = root.resolve(String.valueOf(idDocumentoTipo)).normalize();
        Path destino = carpeta.resolve(UUID.randomUUID() + "." + extension).normalize();
        if (!carpeta.startsWith(root) || !destino.startsWith(carpeta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo no permitida");
        }

        Files.createDirectories(carpeta);
        file.transferTo(destino.toFile());
        tipo.setPlantillaArchivo(destino.toString());
        tipo.setPlantillaNombre(nombreSeguro(file.getOriginalFilename()));
        tipo.setPlantillaExtension(extension);
        DocumentoTipo guardado = documentoTipoRepo.save(tipo);
        Usuario revisor = usuarioRepository.findByCedula(cedulaRevisor)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revisor no encontrado"));
        auditoria(revisor.getIdUsuario(), "PLANTILLA_DOCUMENTAL_ACTUALIZADA",
                "Formato del documento " + idDocumentoTipo + " actualizado por " + cedulaRevisor);
        return guardado;
    }

    public List<DocumentoTipoTHDTO> listarTiposDocumento(TipoProceso tipo) {
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de proceso obligatorio");
        }
        return documentoTipoRepo.findAll().stream()
                .filter(documento -> tipo.name().equalsIgnoreCase(documento.getTipoProceso()))
                .filter(this::tienePlantillaInstitucional)
                .map(documento -> new DocumentoTipoTHDTO(
                        documento.getIdDocumentoTipo(),
                        documento.getNombre(),
                        documento.getTipoProceso(),
                        documento.getPlantillaArchivo() != null,
                        documento.getPlantillaNombre()))
                .toList();
    }

    public Path obtenerRutaPlantilla(Long idDocumentoTipo) {
        DocumentoTipo tipo = documentoTipoRepo.findById(idDocumentoTipo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento tipo no encontrado"));
        if (!tienePlantillaInstitucional(tipo) || tipo.getPlantillaArchivo() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Este documento aún no tiene formato");
        }
        Path root = Paths.get(System.getProperty("user.dir"), "uploads", "plantillas-th")
                .toAbsolutePath().normalize();
        Path archivo = Paths.get(tipo.getPlantillaArchivo()).toAbsolutePath().normalize();
        if (!archivo.startsWith(root) || !Files.isRegularFile(archivo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Formato no encontrado");
        }
        return archivo;
    }

    public String obtenerExtensionPlantilla(Long idDocumentoTipo) {
        return documentoTipoRepo.findById(idDocumentoTipo)
                .map(DocumentoTipo::getPlantillaExtension)
                .filter(extension -> extension != null && !extension.isBlank())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Formato no encontrado"));
    }

    public boolean puedeDescargarPlantilla(Long idUsuario, Long idDocumentoTipo) {
        return documentoTipoRepo.findById(idDocumentoTipo)
                .filter(this::tienePlantillaInstitucional)
                .isPresent()
                && procesoRepo.findByIdUsuarioAndEstado(idUsuario, "EN_PROCESO")
                .stream()
                .max((a, b) -> compareFechaInicio(a.getFechaInicio(), b.getFechaInicio()))
                .filter(proceso -> proceso.getIdChecklist() != null)
                .filter(proceso -> checklistRepo.findByIdChecklist(proceso.getIdChecklist()).stream()
                        .anyMatch(detalle -> detalle.getIdDocumentoTipo().equals(idDocumentoTipo)))
                .isPresent();
    }

    public EstadoLaboralDTO obtenerEstadoLaboral(String cedula) {
        if (!cedulaValida(cedula)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula no es válida");
        }
        Usuario usuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        List<Boolean> estados = jdbc.query(
                "SELECT activo FROM administracionzonal.usuarios_institucion WHERE id_usuario = ?",
                (rs, rowNum) -> rs.getBoolean("activo"),
                usuario.getIdUsuario());
        boolean activo = (estados.isEmpty() || estados.get(0))
                && !Boolean.TRUE.equals(usuario.getBloqueado());
        return new EstadoLaboralDTO(
                usuario.getCedula(),
                usuario.getNombres(),
                activo);
    }

    public ConsultaUsuarioTHDTO consultarUsuario(String cedula) {
        if (!cedulaValida(cedula)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula no es válida");
        }
        return usuarioRepository.findByCedula(cedula)
                .map(usuario -> new ConsultaUsuarioTHDTO(true, usuario.getNombres()))
                .orElseGet(() -> new ConsultaUsuarioTHDTO(false, null));
    }

    @Transactional
    public EstadoLaboralDTO actualizarEstadoLaboral(String cedula, boolean activo, String cedulaRevisor) {
        if (!cedulaValida(cedula)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula no es válida");
        }
        Usuario usuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        jdbc.update("""
                INSERT INTO administracionzonal.usuarios_institucion (id_usuario, activo)
                VALUES (?, ?)
                ON CONFLICT (id_usuario) DO UPDATE SET activo = EXCLUDED.activo
                """, usuario.getIdUsuario(), activo);
        usuario.setBloqueado(!activo);
        usuario.setMotivoBloqueo(activo ? null : "Bloqueado por Talento Humano");
        usuario.setUpdatedAt(LocalDateTime.now());
        usuario.setUpdatedBy(cedulaRevisor);
        usuarioRepository.save(usuario);
        auditoria(usuario.getIdUsuario(), activo ? "ACTIVAR_USUARIO_INSTITUCIONAL" : "DESACTIVAR_USUARIO_INSTITUCIONAL",
                "Estado laboral actualizado por " + cedulaRevisor);
        return new EstadoLaboralDTO(usuario.getCedula(), usuario.getNombres(), activo);
    }

    public boolean tieneAccesoInstitucional(Long idUsuario) {
        List<Boolean> estados = jdbc.query(
                "SELECT activo FROM administracionzonal.usuarios_institucion WHERE id_usuario = ?",
                (rs, rowNum) -> rs.getBoolean("activo"),
                idUsuario);
        if (estados.isEmpty() || estados.get(0)) {
            return true;
        }
        return !procesoRepo.findByIdUsuarioAndTipoAndEstado(idUsuario, TipoProceso.INGRESO.name(), "EN_PROCESO")
                .isEmpty()
                || !procesoRepo.findByIdUsuarioAndTipoAndEstado(idUsuario, TipoProceso.SALIDA.name(), "EN_PROCESO")
                        .isEmpty();
    }

    // ==========================
    // CAMBIAR ESTADO DOCUMENTO
    // ==========================
    @Transactional
    public UsuarioDocumento cambiarEstadoDocumento(
            Long id, EstadoDocumento estado, String observacion, String cedulaAprobador) {

        if (id == null || estado == null || estado == EstadoDocumento.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de revisión no válido");
        }
        if (estado == EstadoDocumento.RECHAZADO && (observacion == null || observacion.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Indique la observación para rechazar el documento");
        }
        UsuarioDocumento doc = documentoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
        if (!EstadoDocumento.PENDIENTE.name().equals(doc.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se pueden revisar documentos pendientes");
        }
        if (!archivoDisponible(doc)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El documento no tiene un archivo disponible");
        }
        boolean incluidoEnProcesoActivo = procesoRepo.findByIdUsuarioAndEstado(doc.getIdUsuario(), "EN_PROCESO")
                .stream()
                .filter(proceso -> proceso.getIdChecklist() != null)
                .anyMatch(proceso -> checklistRepo.findByIdChecklist(proceso.getIdChecklist()).stream()
                        .anyMatch(requisito -> requisito.getIdDocumentoTipo()
                                .equals(doc.getDocumentoTipo().getIdDocumentoTipo())));
        if (!incluidoEnProcesoActivo) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El documento no pertenece al checklist activo del usuario");
        }

        doc.setEstado(estado.name());
        doc.setObservacionRevision(observacion == null || observacion.isBlank() ? null : observacion.trim());
        UsuarioDocumento guardado = documentoRepo.save(doc);
        auditoria(doc.getIdUsuario(), "REVISION_DOCUMENTO",
                "Documento " + id + " marcado " + estado.name() + " por " + cedulaAprobador
                        + (doc.getObservacionRevision() == null ? "" : ": " + doc.getObservacionRevision()));
        return guardado;
    }

    // ==========================
    // VALIDAR CHECKLIST
    // ==========================
    public boolean validarChecklist(Long idUsuario, Long idChecklist, TipoProceso tipo) {

        List<ChecklistDetalle> requisitos = checklistRepo.findByIdChecklist(idChecklist);
        List<UsuarioDocumento> docs = documentoRepo.findByIdUsuario(idUsuario);
        if (requisitos.isEmpty() || tipo == null) {
            return false;
        }

        for (ChecklistDetalle req : requisitos) {
            DocumentoTipo documentoTipo = documentoTipoRepo.findById(req.getIdDocumentoTipo()).orElse(null);
            if (documentoTipo == null || !tipo.name().equalsIgnoreCase(documentoTipo.getTipoProceso())) {
                return false;
            }

            boolean existe = docs.stream()
                    .anyMatch(d -> d.getDocumentoTipo().getIdDocumentoTipo().equals(req.getIdDocumentoTipo())
                            && EstadoDocumento.APROBADA.name().equals(d.getEstado())
                            && archivoDisponible(d));

            if (Boolean.TRUE.equals(req.getObligatorio()) && !existe) {
                return false;
            }
        }

        for (UsuarioDocumento documento : docs) {
            boolean perteneceAlChecklist = requisitos.stream()
                    .anyMatch(req -> req.getIdDocumentoTipo()
                            .equals(documento.getDocumentoTipo().getIdDocumentoTipo()));
            if (perteneceAlChecklist && archivoDisponible(documento)
                    && !EstadoDocumento.APROBADA.name().equals(documento.getEstado())) {
                return false;
            }
        }

        return true;
    }

    // ==========================
    // FINALIZAR PROCESO
    // ==========================
    @Transactional
    public Optional<ProcesoUsuarioDTO> finalizarProceso(Long idUsuario, Long idChecklist, TipoProceso tipo) {

        if (idUsuario == null || idChecklist == null || tipo == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Usuario, checklist y tipo de proceso son obligatorios");
        }
        if (!validarChecklist(idUsuario, idChecklist, tipo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El checklist tiene documentos pendientes, rechazados o no corresponde al proceso");
        }

        UsuarioProceso proceso = procesoRepo.findByIdUsuarioAndTipoAndEstado(
                        idUsuario, tipo.name(), "EN_PROCESO")
                .stream()
                .max((a, b) -> compareFechaInicio(a.getFechaInicio(), b.getFechaInicio()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "No existe un proceso activo de este tipo"));
        if (!idChecklist.equals(proceso.getIdChecklist())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El checklist no corresponde al proceso activo");
        }

        Long siguienteChecklist = siguienteChecklist(idChecklist);
        if (siguienteChecklist != null && !esChecklistDelTipo(siguienteChecklist, tipo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El checklist siguiente no corresponde al proceso");
        }
        proceso.setEstado("COMPLETADO");
        proceso.setFechaFin(LocalDateTime.now());
        procesoRepo.save(proceso);

        if (siguienteChecklist != null) {
            UsuarioProceso siguiente = crearProceso(idUsuario, tipo, siguienteChecklist, null);
            auditoria(idUsuario, "AVANZAR_CHECKLIST",
                    "Checklist " + idChecklist + " completado; continúa " + siguienteChecklist);
            return Optional.of(aDto(siguiente));
        }

        if (tipo == TipoProceso.INGRESO || tipo == TipoProceso.SALIDA) {
            jdbc.update(
                    "UPDATE administracionzonal.usuarios_institucion SET activo = ? WHERE id_usuario = ?",
                    tipo == TipoProceso.INGRESO,
                    idUsuario);
        }

        auditoria(idUsuario, "FINALIZAR_PROCESO", tipo.name());
        return Optional.empty();
    }

    // ==========================
    // CREAR USUARIO TH
    // ==========================
    @Transactional
    public AltaUsuarioResponseDTO crearOActivarUsuario(CrearUsuarioDTO dto) {

        if (!cedulaValida(dto.getCedula())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula no es válida");
        }
        if (dto.getNombres() == null || dto.getNombres().isBlank()) {
            Optional<Usuario> usuarioExistente = usuarioRepository.findByCedula(dto.getCedula());
            if (usuarioExistente.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingrese los nombres del nuevo servidor");
            }
        }
        Long idChecklist = dto.getIdChecklist() == null
                ? checklistInicial(TipoProceso.INGRESO)
                : dto.getIdChecklist();
        if (!esChecklistDelTipo(idChecklist, TipoProceso.INGRESO)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El checklist no corresponde al proceso de ingreso");
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByCedula(dto.getCedula());

        Usuario usuario;
        boolean creado = usuarioOpt.isEmpty();
        String claveTemporal = null;

        if (usuarioOpt.isPresent()) {
            usuario = usuarioOpt.get();
        } else {
            usuario = new Usuario();
            usuario.setCedula(dto.getCedula());
            usuario.setNombres(dto.getNombres().trim());
            usuario.setCorreo(dto.getCedula() + "@quito.gob.ec");
            claveTemporal = claveInicialServidor == null || claveInicialServidor.isBlank()
                    ? generarClaveTemporal()
                    : claveInicialServidor;
            usuario.setPassword(passwordEncoder.encode(claveTemporal));
            usuario.setDebeCambiarPassword(true);
            usuario.setAceptaAcuerdo(false);
            usuario.setInstitucion("ADMINISTRACIÓN ZONAL VALLE DE LOS CHILLOS");
            usuario.setTipoUsuario("SERVIDOR_AZVCH");
            usuario.setCreatedAt(LocalDateTime.now());
            usuario.setCreatedBy("TALENTO_HUMANO");
        }

        Rol rolServidor = rolRepo.findByNombre("SERVIDOR_AZVCH")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No existe el rol SERVIDOR_AZVCH"));
        usuario.getRoles().add(rolServidor);
        usuario.setTipoUsuario("SERVIDOR_AZVCH");
        usuario.setInstitucion("ADMINISTRACIÓN ZONAL VALLE DE LOS CHILLOS");
        usuario.setBloqueado(false);
        usuario.setMotivoBloqueo(null);
        usuario.setUpdatedAt(LocalDateTime.now());
        usuario.setUpdatedBy("TALENTO_HUMANO");
        usuario = usuarioRepository.save(usuario);

        crearDocumentosIniciales(usuario.getIdUsuario());

        jdbc.update("""
                    INSERT INTO administracionzonal.usuarios_institucion (id_usuario, activo)
                    VALUES (?, false)
                    ON CONFLICT (id_usuario) DO UPDATE SET activo = false
                """, usuario.getIdUsuario());

        UsuarioProceso proceso = crearOAsociarProceso(
                usuario.getIdUsuario(), TipoProceso.INGRESO, idChecklist, null);
        auditoria(usuario.getIdUsuario(), "INICIAR_PROCESO", TipoProceso.INGRESO.name());

        return new AltaUsuarioResponseDTO(usuario.getIdUsuario(), creado, claveTemporal, proceso.getIdUsuarioProceso());
    }

    @Transactional
    public UsuarioProceso iniciarProceso(String cedula, TipoProceso tipo, Long idChecklist, String motivo) {
        if (!cedulaValida(cedula)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula no es válida");
        }
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de proceso obligatorio");
        }
        if (idChecklist == null) {
            idChecklist = checklistInicial(tipo);
        }
        if (tipo == TipoProceso.SALIDA && (motivo == null || motivo.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El motivo de desvinculación es obligatorio");
        }
        if (!esChecklistDelTipo(idChecklist, tipo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de proceso y checklist deben coincidir");
        }
        Usuario usuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        if (tipo == TipoProceso.SALIDA) {
            usuario.setBloqueado(false);
            usuario.setMotivoBloqueo(null);
            usuario.setUpdatedAt(LocalDateTime.now());
            usuario.setUpdatedBy("TALENTO_HUMANO");
            usuarioRepository.save(usuario);
        }
        crearDocumentosIniciales(usuario.getIdUsuario());
        if (tipo == TipoProceso.INGRESO) {
            jdbc.update(
                    """
                    INSERT INTO administracionzonal.usuarios_institucion (id_usuario, activo)
                    VALUES (?, false)
                    ON CONFLICT (id_usuario) DO UPDATE SET activo = false
                    """,
                    usuario.getIdUsuario());
        } else {
            jdbc.update(
                    """
                    INSERT INTO administracionzonal.usuarios_institucion (id_usuario, activo)
                    VALUES (?, true)
                    ON CONFLICT (id_usuario) DO NOTHING
                    """,
                    usuario.getIdUsuario());
        }
        UsuarioProceso proceso = crearOAsociarProceso(usuario.getIdUsuario(), tipo, idChecklist, motivo);
        auditoria(usuario.getIdUsuario(), "INICIAR_PROCESO", tipo.name());
        return proceso;
    }

    public Optional<ProcesoUsuarioDTO> obtenerProcesoActual(Long idUsuario) {
        return procesoRepo.findByIdUsuarioAndEstado(idUsuario, "EN_PROCESO")
                .stream()
                .max((a, b) -> compareFechaInicio(a.getFechaInicio(), b.getFechaInicio()))
                .map(proceso -> new ProcesoUsuarioDTO(
                        proceso.getIdUsuarioProceso(),
                        proceso.getTipo(),
                        proceso.getEstado(),
                        proceso.getIdChecklist(),
                        nombreChecklist(proceso.getIdChecklist())));
    }

    public List<ChecklistConfiguracionDTO> listarChecklists(TipoProceso tipo) {
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de proceso obligatorio");
        }
        return jdbc.query("""
                SELECT c.id_checklist, c.tipo, c.nombre, COUNT(d.id) AS cantidad_documentos
                FROM administracionzonal.checklist_configuracion c
                JOIN administracionzonal.checklist_detalle d ON d.id_checklist = c.id_checklist
                WHERE c.tipo = ?
                GROUP BY c.id_checklist, c.tipo, c.nombre
                ORDER BY c.orden, c.id_checklist
                """, (rs, rowNum) -> new ChecklistConfiguracionDTO(
                rs.getLong("id_checklist"),
                rs.getString("tipo"),
                rs.getString("nombre"),
                rs.getInt("cantidad_documentos")), tipo.name());
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

        List<UsuarioDocumento> docs = documentoRepo.findByIdUsuarioOrderByIdDesc(idUsuario);
        Optional<UsuarioProceso> procesoActual = procesoRepo.findByIdUsuarioAndEstado(idUsuario, "EN_PROCESO")
                .stream()
                .max((a, b) -> compareFechaInicio(a.getFechaInicio(), b.getFechaInicio()));
        List<ChecklistDetalle> requisitos = procesoActual
                .filter(p -> p.getIdChecklist() != null)
                .map(p -> checklistRepo.findByIdChecklist(p.getIdChecklist()))
                .orElse(List.of());
        return docs.stream()
                .map(doc -> new UsuarioDocumentoDTO(
                doc.getId(), // 🔥 ID ÚNICO (clave para React)
                doc.getDocumentoTipo().getIdDocumentoTipo(),
                doc.getDocumentoTipo().getNombre(),
                doc.getEstado(),
                doc.getDocumentoTipo().getTipoProceso(),
                archivoDisponible(doc),
                doc.getObservacionRevision(),
                requisitos.stream().anyMatch(req -> Boolean.TRUE.equals(req.getObligatorio())
                        && req.getIdDocumentoTipo().equals(doc.getDocumentoTipo().getIdDocumentoTipo())),
                requisitos.stream().anyMatch(req ->
                        req.getIdDocumentoTipo().equals(doc.getDocumentoTipo().getIdDocumentoTipo())),
                extensionDe(doc.getRutaArchivo()),
                doc.getDocumentoTipo().getPlantillaArchivo() != null,
                doc.getDocumentoTipo().getPlantillaNombre()))
                .toList();
    }

    public byte[] leerDocumento(Long idDocumento) throws IOException {
        UsuarioDocumento documento = documentoRepo.findById(idDocumento)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
        if (documento.getRutaArchivo() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El documento todavía no tiene archivo");
        }
        Path root = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();
        Path archivo = Paths.get(documento.getRutaArchivo()).toAbsolutePath().normalize();
        if (!archivo.startsWith(root) || !Files.isRegularFile(archivo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
        }
        return Files.readAllBytes(archivo);
    }

    public String obtenerExtensionArchivo(Long idDocumento) {
        UsuarioDocumento documento = documentoRepo.findById(idDocumento)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
        return extensionDe(documento.getRutaArchivo());
    }

    public Long obtenerPropietarioDocumento(Long idDocumento) {
        return documentoRepo.findById(idDocumento)
                .map(UsuarioDocumento::getIdUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento no encontrado"));
    }

    public void crearDocumentosIniciales(Long idUsuario) {

        List<DocumentoTipo> tipos = documentoTipoRepo.findAll();

        for (DocumentoTipo tipo : tipos) {

            Optional<UsuarioDocumento> existente = documentoRepo.findByIdUsuarioAndDocumentoTipo_IdDocumentoTipo(
                    idUsuario, tipo.getIdDocumentoTipo());

            if (existente.isEmpty()) {

                UsuarioDocumento doc = new UsuarioDocumento();
                doc.setIdUsuario(idUsuario);
                doc.setDocumentoTipo(tipo);
                doc.setEstado("PENDIENTE");

                documentoRepo.save(doc);
            }
        }
    }

    private UsuarioProceso crearProceso(Long idUsuario, TipoProceso tipo, Long idChecklist, String motivo) {
        UsuarioProceso proceso = new UsuarioProceso();
        proceso.setIdUsuario(idUsuario);
        proceso.setTipo(tipo.name());
        proceso.setEstado("EN_PROCESO");
        proceso.setIdChecklist(idChecklist);
        proceso.setMotivo(motivo == null || motivo.isBlank() ? null : motivo.trim());
        proceso.setFechaInicio(LocalDateTime.now());
        return procesoRepo.save(proceso);
    }

    private UsuarioProceso crearOAsociarProceso(
            Long idUsuario, TipoProceso tipo, Long idChecklist, String motivo) {
        List<UsuarioProceso> pendientes = procesoRepo.findByIdUsuarioAndEstado(idUsuario, "EN_PROCESO");
        if (pendientes.size() > 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El usuario tiene varios procesos pendientes; requiere revisión de Talento Humano");
        }
        if (pendientes.size() == 1) {
            UsuarioProceso pendiente = pendientes.get(0);
            if (!tipo.name().equals(pendiente.getTipo())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya tiene otro proceso pendiente");
            }
            if (pendiente.getIdChecklist() == null) {
                pendiente.setIdChecklist(idChecklist);
                if (motivo != null && !motivo.isBlank()) {
                    pendiente.setMotivo(motivo.trim());
                }
                return procesoRepo.save(pendiente);
            }
            if (pendiente.getIdChecklist().equals(idChecklist)) {
                if (motivo != null && !motivo.isBlank()) {
                    pendiente.setMotivo(motivo.trim());
                    return procesoRepo.save(pendiente);
                }
                return pendiente;
            }
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "El proceso pendiente ya tiene otro checklist asociado");
        }
        return crearProceso(idUsuario, tipo, idChecklist, motivo);
    }

    private boolean esChecklistDelTipo(Long idChecklist, TipoProceso tipo) {
        List<ChecklistDetalle> requisitos = checklistRepo.findByIdChecklist(idChecklist);
        List<String> tiposConfigurados = jdbc.query(
                "SELECT tipo FROM administracionzonal.checklist_configuracion WHERE id_checklist = ?",
                (rs, rowNum) -> rs.getString("tipo"),
                idChecklist);
        return !tiposConfigurados.isEmpty()
                && tipo.name().equalsIgnoreCase(tiposConfigurados.get(0))
                && !requisitos.isEmpty() && requisitos.stream().allMatch(detalle ->
                documentoTipoRepo.findById(detalle.getIdDocumentoTipo())
                        .map(documento -> tipo.name().equalsIgnoreCase(documento.getTipoProceso()))
                        .orElse(false));
    }

    private Long checklistInicial(TipoProceso tipo) {
        String codigo = switch (tipo) {
            case INGRESO -> "INGRESO_SELECCION";
            case SALIDA -> "SALIDA_DESVINCULACION";
            case PERMANENCIA -> "PERMANENCIA_CAPACITACION";
        };
        List<Long> ids = jdbc.query(
                "SELECT id_checklist FROM administracionzonal.checklist_configuracion WHERE codigo = ?",
                (rs, rowNum) -> rs.getLong("id_checklist"),
                codigo);
        if (ids.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No hay checklist configurado para " + tipo);
        }
        return ids.get(0);
    }

    private Long siguienteChecklist(Long idChecklist) {
        List<Long> ids = jdbc.query(
                """
                SELECT siguiente_checklist_id
                FROM administracionzonal.checklist_configuracion
                WHERE id_checklist = ? AND siguiente_checklist_id IS NOT NULL
                """,
                (rs, rowNum) -> rs.getLong("siguiente_checklist_id"),
                idChecklist);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private String nombreChecklist(Long idChecklist) {
        if (idChecklist == null) return "";
        List<String> nombres = jdbc.query(
                "SELECT nombre FROM administracionzonal.checklist_configuracion WHERE id_checklist = ?",
                (rs, rowNum) -> rs.getString("nombre"),
                idChecklist);
        return nombres.isEmpty() ? "" : nombres.get(0);
    }

    private ProcesoUsuarioDTO aDto(UsuarioProceso proceso) {
        return new ProcesoUsuarioDTO(
                proceso.getIdUsuarioProceso(),
                proceso.getTipo(),
                proceso.getEstado(),
                proceso.getIdChecklist(),
                nombreChecklist(proceso.getIdChecklist()));
    }

    private int compareFechaInicio(LocalDateTime a, LocalDateTime b) {
        if (a == null) return b == null ? 0 : -1;
        if (b == null) return 1;
        return a.compareTo(b);
    }

    private String validarArchivo(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        int punto = original == null ? -1 : original.lastIndexOf('.');
        String extension = punto < 0 ? "" : original.substring(punto + 1).toLowerCase(Locale.ROOT);
        if (!List.of("pdf", "doc", "docx", "xls", "xlsx").contains(extension)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Solo se aceptan archivos PDF, Word o Excel");
        }

        byte[] firma = file.getInputStream().readNBytes(8);
        boolean valida = switch (extension) {
            case "pdf" -> firma.length >= 5
                    && "%PDF-".equals(new String(firma, 0, 5, java.nio.charset.StandardCharsets.US_ASCII));
            case "doc", "xls" -> firma.length >= 8
                    && (firma[0] & 0xFF) == 0xD0
                    && (firma[1] & 0xFF) == 0xCF
                    && (firma[2] & 0xFF) == 0x11
                    && (firma[3] & 0xFF) == 0xE0;
            case "docx", "xlsx" -> firma.length >= 4
                    && firma[0] == 'P'
                    && firma[1] == 'K'
                    && firma[2] == 3
                    && firma[3] == 4;
            default -> false;
        };
        if (!valida) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo no coincide con su formato");
        }
        return extension;
    }

    private String nombreSeguro(String nombre) {
        if (nombre == null || nombre.isBlank()) return "formato";
        String normalizado = nombre.replace('\\', '/');
        return normalizado.substring(normalizado.lastIndexOf('/') + 1)
                .replaceAll("[\\r\\n]", "");
    }

    private static String generarClaveTemporal() {
        StringBuilder clave = new StringBuilder(20);
        for (int i = 0; i < 20; i++) {
            clave.append(CARACTERES_CLAVE.charAt(GENERADOR_CLAVE.nextInt(CARACTERES_CLAVE.length())));
        }
        return clave.toString();
    }

    private boolean tienePlantillaInstitucional(DocumentoTipo tipo) {
        return DOCUMENTOS_CON_PLANTILLA.containsKey(normalizarNombreDocumento(tipo.getNombre()));
    }

    private static String normalizarNombreDocumento(String nombre) {
        return Normalizer.normalize(nombre, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String extensionDe(String ruta) {
        if (ruta == null) return "";
        int punto = ruta.lastIndexOf('.');
        return punto < 0 ? "" : ruta.substring(punto + 1).toLowerCase(Locale.ROOT);
    }

    private boolean archivoDisponible(UsuarioDocumento documento) {
        if (documento.getRutaArchivo() == null) {
            return false;
        }
        Path root = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();
        Path archivo;
        try {
            archivo = Paths.get(documento.getRutaArchivo()).toAbsolutePath().normalize();
        } catch (InvalidPathException e) {
            return false;
        }
        return archivo.startsWith(root) && Files.isRegularFile(archivo);
    }

    private boolean cedulaValida(String cedula) {
        if (cedula == null || !cedula.matches("\\d{10}")) return false;
        int provincia = Integer.parseInt(cedula.substring(0, 2));
        if (provincia < 1 || provincia > 24) return false;

        int suma = 0;
        for (int i = 0; i < 9; i++) {
            int valor = Character.digit(cedula.charAt(i), 10) * (i % 2 == 0 ? 2 : 1);
            suma += valor > 9 ? valor - 9 : valor;
        }
        return (10 - suma % 10) % 10 == Character.digit(cedula.charAt(9), 10);
    }
}