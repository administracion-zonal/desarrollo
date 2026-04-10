package com.administracionzonal.controller;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.dto.ReservaAdminDTO;
import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.dto.ReservaUsuarioDTO;
import com.administracionzonal.service.ReservaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    /* ===================== CREAR RESERVA ===================== */
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaDTO dto) {

        // Validación mínima (reglas técnicas)
        long minutos = Duration
                .between(dto.getHoraInicio(), dto.getHoraFin())
                .toMinutes();

        if (minutos <= 0 || minutos > 120) {
            return ResponseEntity
                    .badRequest()
                    .body("La reserva debe ser entre 30 minutos y 2 horas");
        }

        try {
            return ResponseEntity.ok(
                    reservaService.crearReservaPublica(dto));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    /* ===================== LISTAR ===================== */
    @GetMapping("/todas")
    public List<ReservaAdminDTO> listarReservasAdmin() {
        return reservaService.listarReservasAdmin();
    }

    /* ===================== DISPONIBILIDAD REAL ===================== */
    @GetMapping("/disponibilidad")
    public ResponseEntity<DisponibilidadDTO> disponibilidad(
            @RequestParam String nombreArea,
            @RequestParam LocalDate fecha) {
        return ResponseEntity.ok(
                reservaService.obtenerDisponibilidad(nombreArea, fecha));
    }

    /* ===================== VALIDAR QR ===================== */
    @GetMapping("/validar-qr/{token}")
    public ResponseEntity<?> validarQR(@PathVariable String token) {

        boolean valido = reservaService.validarQR(token);

        if (!valido) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("QR inválido o ya utilizado");
        }

        return ResponseEntity.ok("Reserva válida");
    }

    /* ===================== PING ===================== */
    @GetMapping("/ping")
    public String ping() {
        return "Backend funcionando correctamente ✅";
    }

    @PostMapping("/{id}/asistir")
    public ResponseEntity<?> asistir(@PathVariable Long id) {
        reservaService.marcarAsistencia(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mis")
    public ResponseEntity<List<ReservaUsuarioDTO>> misReservas(Authentication auth) {

        String cedula = auth.getName(); // viene del token

        return ResponseEntity.ok(
                reservaService.listarReservasUsuario(cedula));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(
            @PathVariable Long id,
            Authentication auth) {

        reservaService.cancelarReserva(id, auth.getName());

        return ResponseEntity.ok().build();
    }

}
