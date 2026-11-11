package com.administracionzonal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CrearExpedienteCompraRequest {
    @NotBlank
    @Size(max = 200)
    private String titulo;

    @NotBlank
    private String objetoCompra;

    private String descripcion;

    @Size(max = 200)
    private String referenciaOficial;
}
