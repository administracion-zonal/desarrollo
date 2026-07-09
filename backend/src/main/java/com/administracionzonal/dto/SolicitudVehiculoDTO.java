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
    private String observaciones;
    private String origen;
    private String servidores;
    private String observacionRechazo;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

    private String nombres;
    private String cedula;
    private String estado;
}