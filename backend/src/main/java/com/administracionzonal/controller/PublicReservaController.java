package com.administracionzonal.controller;

import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.service.ReservaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/public/reservas")
@RequiredArgsConstructor
public class PublicReservaController {

    private final ReservaService reservaService;

    // 🔓 CREAR RESERVA (SIN LOGIN)
    @PostMapping("/reservar")
    public ResponseEntity<?> crearReserva(@RequestBody ReservaDTO dto) {
        try {
            return ResponseEntity.ok(reservaService.crearReservaPublica(dto));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    // 🔓 VER DISPONIBILIDAD
    @GetMapping("/disponibilidad")
    public DisponibilidadDTO disponibilidad(
            @RequestParam String nombreArea,
            @RequestParam LocalDate fecha) {
        return reservaService.obtenerDisponibilidad(nombreArea, fecha);
    }

    // 🔓 TEST
    @GetMapping("/ping")
    public String ping() {
        return "Reserva pública funcionando ✅";
    }
}
