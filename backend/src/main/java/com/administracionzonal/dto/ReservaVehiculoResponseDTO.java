package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.administracionzonal.entity.Usuario;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReservaVehiculoResponseDTO {

    private Usuario usuario;
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
}