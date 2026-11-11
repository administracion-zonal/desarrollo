package com.administracionzonal.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExpedienteDocumentoVersionDTO {
    private Long id;
    private String categoria;
    private Integer version;
    private String nombreArchivo;
    private Long tamanoBytes;
    private String subidoPor;
    private LocalDateTime subidoEn;
}
