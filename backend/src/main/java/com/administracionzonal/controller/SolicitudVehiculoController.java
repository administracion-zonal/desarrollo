package com.administracionzonal.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.AprobarSolicitudRequest;
import com.administracionzonal.dto.SolicitudVehiculoRequest;
import com.administracionzonal.entity.SolicitudVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.service.SolicitudVehiculoService;

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
            @RequestBody SolicitudVehiculoRequest req,
            Authentication auth) {

        // 🔐 obtener usuario desde JWT
        String cedula = auth.getName();

        Usuario usuario = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Parsear fecha y hora desde String a LocalDate/LocalTime
        LocalDate fecha = LocalDate.parse(req.getFecha(), DateTimeFormatter.ISO_LOCAL_DATE);
        LocalTime horaInicio = LocalTime.parse(req.getHoraInicio(), DateTimeFormatter.ISO_LOCAL_TIME);
        LocalTime horaFin = LocalTime.parse(req.getHoraFin(), DateTimeFormatter.ISO_LOCAL_TIME);

        SolicitudVehiculo s = service.crearSolicitud(
                usuario,
                fecha,
                horaInicio,
                horaFin,
                req.getMotivo()

        );

        return ResponseEntity.ok(s);
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
            @RequestBody AprobarSolicitudRequest request) {

        System.out.println("APROBANDO 👉 " + id + " chofer: " + request.getIdChofer());

        service.aprobarSolicitud(id, request.getIdChofer());

        return ResponseEntity.ok("OK");
    }

    /* ================= RECHAZAR ================= */
    @PostMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Long id) {
        return ResponseEntity.ok(service.rechazarSolicitud(id));
    }
}