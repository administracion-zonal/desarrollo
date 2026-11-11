package com.administracionzonal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SolicitudVehiculoRequest {
    private Long id;
    @NotBlank
    private String fecha;
    @NotBlank
    private String horaInicio;
    @NotBlank
    private String horaFin;
    @NotBlank
    private String motivo;
    @NotBlank
    private String destino;
    private String observaciones;
    @NotBlank
    private String origen;
    @NotBlank
    private String servidores;
    private String observacionRechazo;
    private String estado;
    private String createdAt;
    private String updatedAt;
    private String createdBy;
    private String updatedBy;

    private String nombres;
    private String cedula;

}
