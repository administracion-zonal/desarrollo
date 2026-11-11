package com.administracionzonal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class RegistrarRetornoVehiculoRequest {
    @NotNull
    @PositiveOrZero
    private Long kilometrajeFinal;
    private String novedades;
}
