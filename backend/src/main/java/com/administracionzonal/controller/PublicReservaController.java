package com.administracionzonal.controller;

import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.entity.ReservaCoworking;
import com.administracionzonal.service.ReservaService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/public/reservas")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PublicReservaController {

    private final ReservaService reservaService;

    // 🔓 CREAR RESERVA (SIN LOGIN)
    @PostMapping("/reservar")
    public ResponseEntity<?> crearReserva(@RequestBody ReservaDTO dto) {
        return ResponseEntity.ok(reservaService.crearReservaPublica(dto));
    }

    // 🔓 VER DISPONIBILIDAD
    @GetMapping("/disponibilidad")
    public DisponibilidadDTO disponibilidad(
            @RequestParam String nombreArea,
            @RequestParam LocalDate fecha
    ) {
        return reservaService.obtenerDisponibilidad(nombreArea, fecha);
    }

    // 🔓 TEST
    @GetMapping("/ping")
    public String ping() {
        return "Reserva pública funcionando ✅";
    }
}
