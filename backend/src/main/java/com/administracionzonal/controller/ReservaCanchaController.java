package com.administracionzonal.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.ReservaCanchaDTO;
import com.administracionzonal.dto.ReservaCanchaUsuarioDTO;
import com.administracionzonal.entity.ReservaCancha;
import com.administracionzonal.service.ReservaCanchaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cancha")
@RequiredArgsConstructor
public class ReservaCanchaController {

    private final ReservaCanchaService service;

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaCanchaDTO dto) {
        return ResponseEntity.ok(service.crearReserva(dto));
    }

    @GetMapping("/todas")
    public List<ReservaCancha> listar() {
        return service.listarTodas();
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<?> disponibilidad(
            @RequestParam String fecha,
            @RequestParam(required = false) String cedula) {

        return ResponseEntity.ok(service.obtenerDisponibilidad(
                LocalDate.parse(fecha),
                cedula));
    }

    @PostMapping("/validar")
    public ResponseEntity<String> validarQR(@RequestParam String token) {
        return ResponseEntity.ok(service.validarQR(token));
    }

    @GetMapping("/mis")
    public List<ReservaCanchaUsuarioDTO> misReservas(Authentication auth) {
        String cedula = auth.getName();
        return service.listarReservasUsuario(cedula);
    }

}