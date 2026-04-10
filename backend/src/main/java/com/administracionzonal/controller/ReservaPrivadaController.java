package com.administracionzonal.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.ReservaUsuarioDTO;
import com.administracionzonal.service.ReservaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/privado")
@RequiredArgsConstructor
public class ReservaPrivadaController {

    private final ReservaService reservaService;

    @GetMapping("/mis-reservas")
    public List<ReservaUsuarioDTO> misReservas(Authentication auth) {
        return reservaService.listarReservasUsuario(auth.getName());
    }

    @PostMapping("/reservas/{id}/cancelar")
    public void cancelar(
            @PathVariable Long id,
            Authentication auth) {
        reservaService.cancelarReserva(id, auth.getName());
    }
}