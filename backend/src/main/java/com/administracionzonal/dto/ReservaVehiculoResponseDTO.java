package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReservaVehiculoResponseDTO {

    private Long idReserva;
    private Long idVehiculo;
    private Long idUsuario;
    private Long idChofer;

    private LocalDate fechaReserva;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    private String destino;
    private String estado;
}