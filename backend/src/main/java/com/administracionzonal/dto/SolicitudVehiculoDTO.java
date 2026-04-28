package com.administracionzonal.dto;

import lombok.Data;

@Data
public class SolicitudVehiculoDTO {

    private Long id;
    private String fecha;
    private String horaInicio;
    private String horaFin;
    private String destino;
    private String motivo;

    private String nombres;
    private String cedula;
    private String estado;
}