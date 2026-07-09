package com.administracionzonal.controller;

import java.util.Objects;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.service.OrdenMovilizacionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class OrdenMovilizacionController {

    private final OrdenMovilizacionService service;

    @GetMapping("/admin/orden-movilizacion/{idReserva}")
    public ResponseEntity<byte[]> generar(@PathVariable @NonNull Long idReserva) {
        try {
            byte[] pdf = service.generarOrdenMovilizacion(idReserva);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=orden_movilizacion.pdf")
                    .contentType(MediaType.parseMediaType("application/pdf"))
                    .body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }

    }

    @GetMapping("/chofer/orden-movilizacion/{idReserva}")
    public ResponseEntity<byte[]> generarChofer(
            @PathVariable @NonNull Long idReserva,
            Authentication auth) {

        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new AccessDeniedException("No autenticado");
        }

        try {
            String cedulaChofer = Objects.requireNonNull(auth.getName(), "No autenticado");
            byte[] pdf = service.generarOrdenMovilizacionChofer(idReserva, cedulaChofer);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=orden_movilizacion.pdf")
                    .contentType(MediaType.parseMediaType("application/pdf"))
                    .body(pdf);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }

    }
}
