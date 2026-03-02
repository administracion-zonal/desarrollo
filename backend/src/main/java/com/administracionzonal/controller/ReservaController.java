package com.administracionzonal.controller;

import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.dto.ReservaAdminDTO;
import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.service.ReservaService;
import com.administracionzonal.dto.ReservaUsuarioDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reservas")
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
                    reservaService.crearReservaPublica(dto)
            );
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
            @RequestParam LocalDate fecha
    ) {
        return ResponseEntity.ok(
                reservaService.obtenerDisponibilidad(nombreArea, fecha)
        );
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

}
