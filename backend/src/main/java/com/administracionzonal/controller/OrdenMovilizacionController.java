package com.administracionzonal.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
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
            @PathVariable @NonNull Long idReserva) {

        byte[] pdf = service.generarOrdenMovilizacion(idReserva);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=ordenMovilizacion_" + idReserva + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}