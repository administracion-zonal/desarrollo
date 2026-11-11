package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReservaVehiculoResponseDTO {

    private Long idReserva;
    @NotNull(message = "El idVehiculo es obligatorio")
    private Long idVehiculo;
    // private Long idUsuario;
    private Long idChofer;

    private LocalDate fechaReserva;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    private String destino;
    private String estado;
    private String observaciones;
    private LocalDateTime salidaReal;
    private LocalDateTime retornoReal;
    private Long kilometrajeInicial;
    private Long kilometrajeFinal;
    private String novedades;
}