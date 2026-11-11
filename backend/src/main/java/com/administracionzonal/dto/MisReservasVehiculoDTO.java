package com.administracionzonal.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MisReservasVehiculoDTO {

    private Long idReserva;

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
    private LocalDateTime salidaReal;
    private LocalDateTime retornoReal;
    private Long kilometrajeInicial;
    private Long kilometrajeFinal;
    private String novedades;
}