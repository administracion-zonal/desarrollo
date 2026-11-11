package com.administracionzonal.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.AprobarSolicitudRequest;
import com.administracionzonal.dto.RechazarSolicitudRequest;
import com.administracionzonal.dto.SolicitudVehiculoRequest;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.service.SolicitudVehiculoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos/solicitudes")
@RequiredArgsConstructor
public class SolicitudVehiculoController {

    private final SolicitudVehiculoService service;
    private final UsuarioRepository usuarioRepo;

    /* ================= CREAR SOLICITUD ================= */
    @PostMapping
    public ResponseEntity<?> crearSolicitud(
            @Valid @RequestBody SolicitudVehiculoRequest req,
            Authentication auth) {

        // 🔐 obtener usuario desde JWT
        String cedula = auth.getName();

        Usuario usuario = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Parsear fecha y hora desde String a LocalDate/LocalTime
        LocalDate fecha = LocalDate.parse(req.getFecha());
        LocalTime horaInicio = LocalTime.parse(req.getHoraInicio());
        LocalTime horaFin = LocalTime.parse(req.getHoraFin());

        service.crearSolicitud(
                usuario,
                fecha,
                horaInicio,
                horaFin,
                req.getMotivo(),
                req.getDestino(),
                req.getObservaciones(),
                req.getOrigen(),
                req.getServidores()

        );
        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    /* ================= LISTAR PENDIENTES ================= */
    @GetMapping("/pendientes")
    public ResponseEntity<?> listarPendientes() {
        return ResponseEntity.ok(service.listarPendientes());
    }

    /* ================= APROBAR ================= */

    @PostMapping("/{id}/aprobar")
    public ResponseEntity<?> aprobar(
            @PathVariable Long id,
            @Valid @RequestBody AprobarSolicitudRequest request,
            Authentication auth) {

        service.aprobarSolicitud(id, request.getIdChofer(), auth.getName());

        return ResponseEntity.ok("OK");
    }

    /* ================= RECHAZAR ================= */
    @PostMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazar(
            @PathVariable Long id,
            @RequestBody(required = false) RechazarSolicitudRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.rechazarSolicitud(
                id,
                request != null ? request.getObservacionRechazo() : null,
                auth.getName()));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.cancelarSolicitud(id, auth.getName()));
    }

    @GetMapping("/mis")
    public ResponseEntity<?> misSolicitudes(Authentication auth) {

        String cedula = auth.getName();

        return ResponseEntity.ok(service.listarPorUsuario(cedula));
    }
}