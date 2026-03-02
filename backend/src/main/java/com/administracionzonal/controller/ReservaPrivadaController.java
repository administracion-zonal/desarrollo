package com.administracionzonal.controller;

import com.administracionzonal.dto.ReservaUsuarioDTO;
import com.administracionzonal.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/privado")
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
            Authentication auth
    ) {
        reservaService.cancelarReserva(id, auth.getName());
    }
}