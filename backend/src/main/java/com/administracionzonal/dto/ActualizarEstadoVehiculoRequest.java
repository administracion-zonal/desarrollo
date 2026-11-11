package com.administracionzonal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ActualizarEstadoVehiculoRequest {
    @NotBlank
    private String estado;
}
