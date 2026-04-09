package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Data;

@Data
public class SolicitudVehiculoRequest {
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private String motivo;
}
