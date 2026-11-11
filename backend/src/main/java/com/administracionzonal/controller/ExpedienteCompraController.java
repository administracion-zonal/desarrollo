package com.administracionzonal.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.administracionzonal.dto.CambiarEstadoExpedienteRequest;
import com.administracionzonal.dto.CrearExpedienteCompraRequest;
import com.administracionzonal.dto.ExpedienteCompraDTO;
import com.administracionzonal.dto.ExpedienteDocumentoVersionDTO;
import com.administracionzonal.dto.ExpedienteHistorialDTO;
import com.administracionzonal.service.ExpedienteCompraService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/compras-publicas/expedientes")
@RequiredArgsConstructor
public class ExpedienteCompraController {
    private final ExpedienteCompraService service;

    @PostMapping
    public ExpedienteCompraDTO crear(
            @Valid @RequestBody CrearExpedienteCompraRequest request, Authentication auth) {
        return service.crear(request, auth.getName());
    }

    @GetMapping
    public List<ExpedienteCompraDTO> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public ExpedienteCompraDTO obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PutMapping("/{id}")
    public ExpedienteCompraDTO actualizar(
            @PathVariable Long id,
            @Valid @RequestBody CrearExpedienteCompraRequest request,
            Authentication auth) {
        return service.actualizar(id, request, auth.getName());
    }

    @PutMapping("/{id}/estado")
    public ExpedienteCompraDTO cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoExpedienteRequest request,
            Authentication auth) {
        boolean administrador = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return service.cambiarEstado(id, request, auth.getName(), administrador);
    }

    @PostMapping("/{id}/documentos")
    public ExpedienteDocumentoVersionDTO subirDocumento(
            @PathVariable Long id,
            @RequestParam String categoria,
            @RequestParam MultipartFile file,
            Authentication auth) throws IOException {
        return service.subirDocumento(id, categoria, file, auth.getName());
    }

    @GetMapping("/{id}/documentos")
    public List<ExpedienteDocumentoVersionDTO> listarDocumentos(@PathVariable Long id) {
        return service.listarDocumentos(id);
    }

    @GetMapping("/{id}/documentos/{idVersion}/archivo")
    public ResponseEntity<byte[]> descargarDocumento(
            @PathVariable Long id, @PathVariable Long idVersion) throws IOException {
        ExpedienteDocumentoVersionDTO version = service.listarDocumentos(id).stream()
                .filter(documento -> documento.getId().equals(idVersion))
                .findFirst()
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Versión no encontrada"));
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(version.getNombreArchivo(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(service.descargarDocumento(id, idVersion));
    }

    @GetMapping("/{id}/historial")
    public List<ExpedienteHistorialDTO> historial(@PathVariable Long id) {
        return service.historial(id);
    }

    @PostMapping("/usuarios/{cedula}/rol")
    public ResponseEntity<?> asignarRol(@PathVariable String cedula, Authentication auth) {
        boolean administrador = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!administrador) {
            throw new AccessDeniedException("Solo ADMIN puede asignar el perfil de Compras Públicas");
        }
        service.asignarRolCompras(cedula);
        return ResponseEntity.ok(java.util.Map.of("message", "Perfil COMPRAS_PUBLICAS asignado"));
    }
}
