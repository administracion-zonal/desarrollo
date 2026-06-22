package com.administracionzonal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ViajeVehiculoDTO {
    private Long idReserva;
    private String fechaReserva;
    private String horaInicio;
    private String horaFin;
    private String destino;
    private String observaciones;
    private String estado;
    private String estadoViaje;
    private Boolean noSePresento;
    private String comentarioNoPresentacion;
    private String nombreSolicitante;
    private String cedulaSolicitante;
    private String nombreChofer;
    private String cedulaChofer;
    private String marcaVehiculo;
    private String modeloVehiculo;
    private String placaVehiculo;
}
