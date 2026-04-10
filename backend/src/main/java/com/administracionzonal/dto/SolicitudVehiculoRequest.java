package com.administracionzonal.dto;

import lombok.Data;

@Data
public class SolicitudVehiculoRequest {
    private Long id;
    private String fecha;
    private String horaInicio;
    private String horaFin;
    private String motivo;
    private String estado;

    private String nombres;
    private String cedula;
}
