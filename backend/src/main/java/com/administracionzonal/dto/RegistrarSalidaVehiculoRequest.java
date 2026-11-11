package com.administracionzonal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class RegistrarSalidaVehiculoRequest {
    @NotNull
    @PositiveOrZero
    private Long kilometrajeInicial;
}
