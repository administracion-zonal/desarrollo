package com.administracionzonal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AsignarChoferDTO {

    @NotNull(message = "Id reserva obligatorio")
    private Long idReserva;

    @NotNull(message = "Id chofer obligatorio")
    private Long idChofer;
}