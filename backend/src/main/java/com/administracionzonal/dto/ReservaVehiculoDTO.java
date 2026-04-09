package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservaVehiculoDTO {

    @NotNull(message = "El vehículo es obligatorio")
    private Long idVehiculo;

    private Long idChofer;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate fechaReserva;

    @NotNull(message = "Hora inicio obligatoria")
    private LocalTime horaInicio;

    @NotNull(message = "Hora fin obligatoria")
    private LocalTime horaFin;

    @NotBlank(message = "Destino obligatorio")
    private String destino;

    private String observaciones;
}