package com.administracionzonal.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.service.SalvoconductoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class SalvoconductoController {

    private final SalvoconductoService service;

    @GetMapping("/admin/salvoconducto/{idReserva}")
    public ResponseEntity<byte[]> generar(@PathVariable @NonNull Long idReserva) {

        byte[] pdf = service.generarSalvoconducto(idReserva);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=salvoconducto.pdf")
                .contentType(MediaType.parseMediaType("application/pdf"))
                .body(pdf);

    }
}