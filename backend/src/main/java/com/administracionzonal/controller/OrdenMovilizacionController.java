package com.administracionzonal.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

        @GetMapping("/admin/ordenMovilizacion/{idReserva}")
        public ResponseEntity<byte[]> generar(
                        @PathVariable Long idReserva,
                        Authentication auth) {

                byte[] pdf = service.generarOrdenMovilizacion(idReserva, auth != null ? auth.getName() : null);
                MediaType pdfMediaType = MediaType.parseMediaType("application/pdf");

                return ResponseEntity.ok()
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=ordenMovilizacion_" + idReserva + ".pdf")
                                .contentType(pdfMediaType)
                                .body(pdf);
        }

        @GetMapping("/chofer/ordenMovilizacion/{idReserva}")
        public ResponseEntity<byte[]> generarChofer(
                        @PathVariable Long idReserva,
                        Authentication auth) {

                if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
                        throw new RuntimeException("Usuario no autenticado");
                }

                byte[] pdf = service.generarOrdenMovilizacionChofer(idReserva, auth.getName());
                MediaType pdfMediaType = MediaType.parseMediaType("application/pdf");

                return ResponseEntity.ok()
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=ordenMovilizacion_" + idReserva + ".pdf")
                                .contentType(pdfMediaType)
                                .body(pdf);
        }
}