package com.administracionzonal.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExpedienteHistorialDTO {
    private String estadoAnterior;
    private String estadoNuevo;
    private String observacion;
    private String actor;
    private LocalDateTime fecha;
}
