package com.administracionzonal.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.administracionzonal.dto.ChecklistConfiguracionDTO;
import com.administracionzonal.dto.ConsultaUsuarioTHDTO;
import com.administracionzonal.dto.CrearUsuarioDTO;
import com.administracionzonal.dto.DocumentoTipoTHDTO;
import com.administracionzonal.dto.EstadoLaboralDTO;
import com.administracionzonal.dto.ProcesoUsuarioDTO;
import com.administracionzonal.dto.UsuarioDocumentoDTO;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.enums.EstadoDocumento;
import com.administracionzonal.enums.TipoProceso;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.service.TalentoHumanoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/talento-humano")
public class TalentoHumanoController {

    private final TalentoHumanoService service;
    private final UsuarioRepository usuarioRepository;

    public TalentoHumanoController(TalentoHumanoService service, UsuarioRepository usuarioRepository) {
        this.service = service;
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/documento/upload")
    public ResponseEntity<?> upload(
            @RequestParam Long idDocumentoTipo,
            @RequestParam MultipartFile file,
            Authentication auth) throws IOException {
        Usuario usuario = usuarioActual(auth);
        service.subirDocumento(usuario.getIdUsuario(), idDocumentoTipo, file);
        return ResponseEntity.ok(Map.of("message", "Documento cargado y enviado a revisión"));
    }

    @PutMapping("/documento/{id}/estado")
    public ResponseEntity<?> estado(
            @PathVariable Long id,
            @RequestParam EstadoDocumento estado,
            @RequestParam(required = false) String observacion,
            Authentication auth) {
        exigirTalentoHumano(auth);
        Usuario revisor = usuarioActual(auth);
        service.cambiarEstadoDocumento(id, estado, observacion, revisor.getCedula());
        return ResponseEntity.ok(Map.of("message", "Estado del documento actualizado"));
    }

    @PostMapping("/proceso/finalizar")
    public ResponseEntity<ProcesoUsuarioDTO> finalizar(@RequestParam Long idUsuario,
            @RequestParam Long idChecklist,
            @RequestParam TipoProceso tipo,
            Authentication auth) {
        if (!usuarioActual(auth).getIdUsuario().equals(idUsuario)) {
            throw new AccessDeniedException("Solo puede finalizar su propio proceso");
        }
        Optional<ProcesoUsuarioDTO> siguiente = service.finalizarProceso(idUsuario, idChecklist, tipo);
        return siguiente.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/usuarios/{cedula}/procesos")
    public ResponseEntity<?> iniciarProceso(
            @PathVariable String cedula,
            @RequestParam TipoProceso tipo,
            @RequestParam(required = false) Long idChecklist,
            @RequestParam(required = false) String motivo,
            Authentication auth) {
        exigirTalentoHumano(auth);
        return ResponseEntity.ok(service.iniciarProceso(cedula, tipo, idChecklist, motivo));
    }

    @GetMapping("/checklists")
    public List<ChecklistConfiguracionDTO> listarChecklists(@RequestParam TipoProceso tipo) {
        return service.listarChecklists(tipo);
    }

    @GetMapping("/documentos-tipo")
    public List<DocumentoTipoTHDTO> listarTiposDocumento(
            @RequestParam TipoProceso tipo, Authentication auth) {
        exigirTalentoHumano(auth);
        return service.listarTiposDocumento(tipo);
    }

    @PostMapping("/plantilla/{idDocumentoTipo}/upload")
    public ResponseEntity<?> uploadPlantilla(
            @PathVariable Long idDocumentoTipo,
            @RequestParam MultipartFile file,
            Authentication auth) throws IOException {
        Usuario revisor = usuarioActual(auth);
        exigirTalentoHumano(auth);
        service.subirPlantilla(idDocumentoTipo, file, revisor.getCedula());
        return ResponseEntity.ok(Map.of("message", "Formato actualizado correctamente"));
    }

    @GetMapping("/plantilla/{idDocumentoTipo}/archivo")
    public ResponseEntity<byte[]> descargarPlantilla(
            @PathVariable Long idDocumentoTipo, Authentication auth) throws IOException {
        Usuario actual = usuarioActual(auth);
        if (!esTalentoHumano(auth) && !service.puedeDescargarPlantilla(
                actual.getIdUsuario(), idDocumentoTipo)) {
            throw new AccessDeniedException("El formato no corresponde a su proceso activo");
        }
        Path archivo = service.obtenerRutaPlantilla(idDocumentoTipo);
        String extension = service.obtenerExtensionPlantilla(idDocumentoTipo);
        String nombre = "formato-documento-" + idDocumentoTipo + "." + extension;
        return ResponseEntity.ok()
                .contentType(tipoContenido(extension))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nombre).build().toString())
                .body(Files.readAllBytes(archivo));
    }

    @GetMapping("/usuarios/{cedula}/estado-laboral")
    public EstadoLaboralDTO estadoLaboral(@PathVariable String cedula, Authentication auth) {
        exigirTalentoHumano(auth);
        return service.obtenerEstadoLaboral(cedula);
    }

    @PutMapping("/usuarios/{cedula}/estado-laboral")
    public EstadoLaboralDTO actualizarEstadoLaboral(
            @PathVariable String cedula,
            @RequestParam boolean activo,
            Authentication auth) {
        Usuario revisor = usuarioActual(auth);
        exigirTalentoHumano(auth);
        return service.actualizarEstadoLaboral(cedula, activo, revisor.getCedula());
    }

    @GetMapping("/proceso/actual")
    public ResponseEntity<ProcesoUsuarioDTO> procesoActual(Authentication auth) {
        Optional<ProcesoUsuarioDTO> proceso = service.obtenerProcesoActual(usuarioActual(auth).getIdUsuario());
        if (proceso.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(proceso.get());
    }

    @PostMapping("/crear-o-activar")
    public ResponseEntity<?> crearOActivar(
            @Valid @RequestBody CrearUsuarioDTO dto, Authentication auth) {
        exigirTalentoHumano(auth);
        return ResponseEntity.ok(service.crearOActivarUsuario(dto));
    }

    @GetMapping("/usuarios/{cedula}/consulta")
    public ConsultaUsuarioTHDTO consultarUsuario(@PathVariable String cedula, Authentication auth) {
        exigirTalentoHumano(auth);
        return service.consultarUsuario(cedula);
    }

    @GetMapping("/proceso-pendiente/{idUsuario}")
    public boolean tieneProcesoPendiente(@PathVariable Long idUsuario, Authentication auth) {
        if (!usuarioActual(auth).getIdUsuario().equals(idUsuario)) {
            throw new AccessDeniedException("No puede consultar el proceso de otro usuario");
        }
        return service.tieneProcesoPendiente(idUsuario);
    }

    @GetMapping("/documentos/{idUsuario}")
    public List<UsuarioDocumentoDTO> getDocumentos(@PathVariable Long idUsuario, Authentication auth) {
        if (!esTalentoHumano(auth) && !usuarioActual(auth).getIdUsuario().equals(idUsuario)) {
            throw new AccessDeniedException("No puede consultar documentos de otro usuario");
        }
        return service.getDocumentos(idUsuario);
    }

    @GetMapping("/usuarios/{cedula}/documentos")
    public List<UsuarioDocumentoDTO> getDocumentosParaRevision(
            @PathVariable String cedula, Authentication auth) {
        if (!esTalentoHumano(auth)) {
            throw new AccessDeniedException("Acceso reservado a Talento Humano");
        }
        if (!service.consultarUsuario(cedula).isExiste()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        Usuario usuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return service.getDocumentos(usuario.getIdUsuario());
    }

    @GetMapping("/documento/{id}/archivo")
    public ResponseEntity<byte[]> descargarDocumento(@PathVariable Long id, Authentication auth) throws IOException {
        Usuario actual = usuarioActual(auth);
        Long propietarioId = service.obtenerPropietarioDocumento(id);
        if (!esTalentoHumano(auth) && !actual.getIdUsuario().equals(propietarioId)) {
            throw new AccessDeniedException("No puede descargar documentos de otro usuario");
        }
        String extension = service.obtenerExtensionArchivo(id);
        ContentDisposition disposition = "pdf".equals(extension)
                ? ContentDisposition.inline().filename("documento-" + id + ".pdf").build()
                : ContentDisposition.attachment().filename("documento-" + id + "." + extension).build();
        return ResponseEntity.ok()
                .contentType(tipoContenido(extension))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(service.leerDocumento(id));
    }

    private MediaType tipoContenido(String extension) {
        return switch (extension) {
            case "doc" -> MediaType.parseMediaType("application/msword");
            case "docx" -> MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
            case "xls" -> MediaType.parseMediaType("application/vnd.ms-excel");
            case "xlsx" -> MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            default -> MediaType.APPLICATION_PDF;
        };
    }

    private Usuario usuarioActual(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("No autenticado");
        }
        return usuarioRepository.findByCedula(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("Usuario autenticado no encontrado"));
    }

    private boolean esTalentoHumano(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_TALENTO_HUMANO".equals(a.getAuthority())
                        || "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private void exigirTalentoHumano(Authentication auth) {
        if (!esTalentoHumano(auth)) {
            throw new AccessDeniedException("Acceso reservado a Talento Humano");
        }
    }

}
