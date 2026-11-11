package com.administracionzonal.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.dto.CambiarEstadoExpedienteRequest;
import com.administracionzonal.dto.CrearExpedienteCompraRequest;
import com.administracionzonal.dto.ExpedienteCompraDTO;
import com.administracionzonal.dto.ExpedienteDocumentoVersionDTO;
import com.administracionzonal.dto.ExpedienteHistorialDTO;
import com.administracionzonal.entity.ExpedienteCompra;
import com.administracionzonal.entity.ExpedienteDocumentoVersion;
import com.administracionzonal.entity.ExpedienteHistorial;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.enums.EstadoExpedienteCompra;
import com.administracionzonal.repository.ExpedienteCompraRepository;
import com.administracionzonal.repository.ExpedienteDocumentoVersionRepository;
import com.administracionzonal.repository.ExpedienteHistorialRepository;
import com.administracionzonal.repository.RolRepository;
import com.administracionzonal.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExpedienteCompraService {
    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024;
    private static final List<EstadoExpedienteCompra> TERMINALES =
            List.of(EstadoExpedienteCompra.CERRADO, EstadoExpedienteCompra.CANCELADO);

    private final ExpedienteCompraRepository expedienteRepo;
    private final ExpedienteDocumentoVersionRepository documentoRepo;
    private final ExpedienteHistorialRepository historialRepo;
    private final UsuarioRepository usuarioRepo;
    private final RolRepository rolRepo;

    @Transactional
    public void asignarRolCompras(String cedula) {
        Usuario usuario = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        Rol rol = rolRepo.findByNombre("COMPRAS_PUBLICAS")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "No existe el rol COMPRAS_PUBLICAS"));
        if (usuario.getRoles().add(rol)) {
            usuarioRepo.save(usuario);
        }
    }

    @Transactional
    public ExpedienteCompraDTO crear(CrearExpedienteCompraRequest request, String actor) {
        ExpedienteCompra expediente = new ExpedienteCompra();
        expediente.setTitulo(request.getTitulo().trim());
        expediente.setObjetoCompra(request.getObjetoCompra().trim());
        expediente.setDescripcion(limpiar(request.getDescripcion()));
        expediente.setReferenciaOficial(limpiar(request.getReferenciaOficial()));
        expediente.setEstado(EstadoExpedienteCompra.BORRADOR);
        expediente.setCreatedAt(LocalDateTime.now());
        expediente.setUpdatedAt(LocalDateTime.now());
        expediente.setCreatedBy(actor);
        expediente.setUpdatedBy(actor);
        expediente = expedienteRepo.save(expediente);
        registrarHistorial(expediente, null, EstadoExpedienteCompra.BORRADOR, "Expediente creado", actor);
        return mapear(expediente);
    }

    @Transactional
    public ExpedienteCompraDTO actualizar(
            Long id, CrearExpedienteCompraRequest request, String actor) {
        ExpedienteCompra expediente = obtenerBloqueado(id);
        validarEditable(expediente);
        expediente.setTitulo(request.getTitulo().trim());
        expediente.setObjetoCompra(request.getObjetoCompra().trim());
        expediente.setDescripcion(limpiar(request.getDescripcion()));
        expediente.setReferenciaOficial(limpiar(request.getReferenciaOficial()));
        expediente.setUpdatedAt(LocalDateTime.now());
        expediente.setUpdatedBy(actor);
        ExpedienteCompra guardado = expedienteRepo.save(expediente);
        registrarHistorial(
                guardado, guardado.getEstado(), guardado.getEstado(), "Datos del expediente actualizados", actor);
        return mapear(guardado);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteCompraDTO> listar() {
        return expedienteRepo.findAllByOrderByCreatedAtDescIdDesc().stream()
                .map(this::mapear)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExpedienteCompraDTO obtener(Long id) {
        return mapear(obtener(id, false));
    }

    @Transactional
    public ExpedienteCompraDTO cambiarEstado(
            Long id, CambiarEstadoExpedienteRequest request, String actor, boolean administrador) {
        ExpedienteCompra expediente = obtenerBloqueado(id);
        EstadoExpedienteCompra anterior = expediente.getEstado();
        EstadoExpedienteCompra siguiente = request.getEstado();
        validarTransicion(anterior, siguiente, request.getObservacion(), administrador);

        expediente.setEstado(siguiente);
        expediente.setUpdatedAt(LocalDateTime.now());
        expediente.setUpdatedBy(actor);
        if (siguiente == EstadoExpedienteCompra.CERRADO) {
            expediente.setClosedAt(LocalDateTime.now());
        }
        ExpedienteCompra guardado = expedienteRepo.save(expediente);
        registrarHistorial(
                guardado, anterior, siguiente, limpiar(request.getObservacion()), actor);
        return mapear(guardado);
    }

    @Transactional
    public ExpedienteDocumentoVersionDTO subirDocumento(
            Long id, String categoria, MultipartFile archivo, String actor) throws IOException {
        if (categoria == null || categoria.isBlank() || categoria.trim().length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria y admite hasta 120 caracteres");
        }
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seleccione un archivo");
        }
        if (archivo.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El archivo supera el límite de 20 MB");
        }

        ExpedienteCompra expediente = obtenerBloqueado(id);
        validarEditable(expediente);
        String categoriaNormalizada = categoria.trim();
        int version = documentoRepo
                .findFirstByIdExpedienteAndCategoriaIgnoreCaseOrderByVersionDesc(id, categoriaNormalizada)
                .map(d -> d.getVersion() + 1)
                .orElse(1);

        Path root = Paths.get(System.getProperty("user.dir"), "uploads", "compras-publicas")
                .toAbsolutePath().normalize();
        Path carpeta = root.resolve(String.valueOf(id)).normalize();
        Path destino = carpeta.resolve(UUID.randomUUID() + ".bin").normalize();
        if (!carpeta.startsWith(root) || !destino.startsWith(carpeta)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ruta de archivo no permitida");
        }
        Files.createDirectories(carpeta);
        archivo.transferTo(destino.toFile());

        String original = archivo.getOriginalFilename();
        String nombreArchivo = original == null || original.isBlank()
                ? "documento"
                : original.replace('\\', '/').substring(original.replace('\\', '/').lastIndexOf('/') + 1);
        nombreArchivo = nombreArchivo.replaceAll("[\\p{Cntrl}]", "").trim();
        if (nombreArchivo.isEmpty()) {
            nombreArchivo = "documento";
        }
        if (nombreArchivo.length() > 255) {
            nombreArchivo = nombreArchivo.substring(nombreArchivo.length() - 255);
        }

        ExpedienteDocumentoVersion documento = new ExpedienteDocumentoVersion();
        documento.setIdExpediente(id);
        documento.setCategoria(categoriaNormalizada);
        documento.setVersion(version);
        documento.setNombreArchivo(nombreArchivo);
        documento.setRutaArchivo(destino.toString());
        documento.setTamanoBytes(archivo.getSize());
        documento.setSubidoPor(actor);
        documento.setSubidoEn(LocalDateTime.now());
        ExpedienteDocumentoVersion guardado = documentoRepo.save(documento);

        expediente.setUpdatedAt(LocalDateTime.now());
        expediente.setUpdatedBy(actor);
        expedienteRepo.save(expediente);
        registrarHistorial(
                expediente, expediente.getEstado(), expediente.getEstado(),
                "Archivo agregado: " + categoriaNormalizada + " v" + version, actor);
        return mapear(guardado);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteDocumentoVersionDTO> listarDocumentos(Long id) {
        obtener(id, false);
        return documentoRepo.findByIdExpedienteOrderBySubidoEnDescIdDesc(id).stream()
                .map(this::mapear)
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] descargarDocumento(Long id, Long idVersion) throws IOException {
        ExpedienteDocumentoVersion documento = documentoRepo.findByIdAndIdExpediente(idVersion, id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Versión de documento no encontrada"));
        Path root = Paths.get(System.getProperty("user.dir"), "uploads", "compras-publicas")
                .toAbsolutePath().normalize();
        Path archivo = Paths.get(documento.getRutaArchivo()).toAbsolutePath().normalize();
        if (!archivo.startsWith(root) || !Files.isRegularFile(archivo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Archivo no encontrado");
        }
        return Files.readAllBytes(archivo);
    }

    @Transactional(readOnly = true)
    public List<ExpedienteHistorialDTO> historial(Long id) {
        obtener(id, false);
        return historialRepo.findByIdExpedienteOrderByFechaDescIdDesc(id).stream()
                .map(h -> new ExpedienteHistorialDTO(
                        h.getEstadoAnterior(), h.getEstadoNuevo(), h.getObservacion(), h.getActor(), h.getFecha()))
                .toList();
    }

    private ExpedienteCompra obtener(Long id, boolean bloquear) {
        return (bloquear ? expedienteRepo.findByIdForUpdate(id) : expedienteRepo.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expediente no encontrado"));
    }

    private ExpedienteCompra obtenerBloqueado(Long id) {
        return obtener(id, true);
    }

    private void validarEditable(ExpedienteCompra expediente) {
        if (expediente.getEstado() != EstadoExpedienteCompra.BORRADOR
                && expediente.getEstado() != EstadoExpedienteCompra.OBSERVADO) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Solo se puede editar un expediente en borrador u observado");
        }
    }

    private void validarTransicion(
            EstadoExpedienteCompra actual,
            EstadoExpedienteCompra siguiente,
            String observacion,
            boolean administrador) {
        if (siguiente == null || TERMINALES.contains(actual)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El expediente ya no admite cambios de estado");
        }
        if (siguiente == EstadoExpedienteCompra.CERRADO) {
            if (!administrador) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo ADMIN puede cerrar expedientes");
            }
            if (actual != EstadoExpedienteCompra.APROBADO) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede cerrar un expediente aprobado");
            }
            return;
        }
        if (siguiente == EstadoExpedienteCompra.CANCELADO) {
            validarObservacion(observacion, "Indique el motivo de cancelación");
            return;
        }

        boolean permitida = switch (actual) {
            case BORRADOR -> siguiente == EstadoExpedienteCompra.EN_REVISION;
            case EN_REVISION -> siguiente == EstadoExpedienteCompra.OBSERVADO
                    || siguiente == EstadoExpedienteCompra.APROBADO;
            case OBSERVADO -> siguiente == EstadoExpedienteCompra.EN_REVISION;
            case APROBADO, CERRADO, CANCELADO -> false;
        };
        if (!permitida) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Transición de estado no permitida: " + actual + " → " + siguiente);
        }
        if (siguiente == EstadoExpedienteCompra.OBSERVADO) {
            validarObservacion(observacion, "Indique las observaciones para devolver el expediente");
        }
    }

    private void validarObservacion(String observacion, String mensaje) {
        if (observacion == null || observacion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
        }
    }

    private void registrarHistorial(
            ExpedienteCompra expediente,
            EstadoExpedienteCompra anterior,
            EstadoExpedienteCompra nuevo,
            String observacion,
            String actor) {
        ExpedienteHistorial historial = new ExpedienteHistorial();
        historial.setIdExpediente(expediente.getId());
        historial.setEstadoAnterior(anterior == null ? null : anterior.name());
        historial.setEstadoNuevo(nuevo.name());
        historial.setObservacion(observacion);
        historial.setActor(actor);
        historial.setFecha(LocalDateTime.now());
        historialRepo.save(historial);
    }

    private ExpedienteCompraDTO mapear(ExpedienteCompra expediente) {
        return ExpedienteCompraDTO.builder()
                .id(expediente.getId())
                .titulo(expediente.getTitulo())
                .objetoCompra(expediente.getObjetoCompra())
                .descripcion(expediente.getDescripcion())
                .referenciaOficial(expediente.getReferenciaOficial())
                .estado(expediente.getEstado())
                .createdAt(expediente.getCreatedAt())
                .updatedAt(expediente.getUpdatedAt())
                .closedAt(expediente.getClosedAt())
                .createdBy(expediente.getCreatedBy())
                .updatedBy(expediente.getUpdatedBy())
                .build();
    }

    private ExpedienteDocumentoVersionDTO mapear(ExpedienteDocumentoVersion documento) {
        return new ExpedienteDocumentoVersionDTO(
                documento.getId(),
                documento.getCategoria(),
                documento.getVersion(),
                documento.getNombreArchivo(),
                documento.getTamanoBytes(),
                documento.getSubidoPor(),
                documento.getSubidoEn());
    }

    private String limpiar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

}
