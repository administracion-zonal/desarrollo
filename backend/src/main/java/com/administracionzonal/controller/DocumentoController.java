package com.administracionzonal.controller;

import java.time.LocalDate;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thymeleaf.context.Context;

import com.administracionzonal.service.PdfService;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoController {

    private final PdfService pdfService;

    public DocumentoController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @GetMapping("/contrato/{nombre}/{cedula}")
    public ResponseEntity<byte[]> generarContrato(
            @PathVariable String nombre,
            @PathVariable String cedula) {

        Context context = new Context();
        context.setVariable("nombre", nombre);
        context.setVariable("cedula", cedula);
        context.setVariable("fecha", LocalDate.now().toString());

        byte[] pdf = pdfService.generarPdf("contrato", context);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=contrato.pdf")
                .contentType(MediaType.parseMediaType("application/pdf"))
                .body(pdf);
    }
}