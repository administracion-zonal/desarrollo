package com.administracionzonal.dto;

import lombok.Data;

@Data
public class MisReservasVehiculoDTO {

    private Long idReserva;
    private Long idSolicitud;

    private String fechaReserva;
    private String horaInicio;
    private String horaFin;

    private String destino;
    private String observaciones;
    private String estado;

    // chofer
    private String nombreChofer;

    // vehículo
    private String marcaVehiculo;
    private String modeloVehiculo;
    private String placaVehiculo;
}