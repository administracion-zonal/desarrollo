package com.administracionzonal.dto;

import com.administracionzonal.enums.EstadoExpedienteCompra;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarEstadoExpedienteRequest {
    @NotNull
    private EstadoExpedienteCompra estado;
    private String observacion;
}
