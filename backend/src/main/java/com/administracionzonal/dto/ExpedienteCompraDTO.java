package com.administracionzonal.dto;

import java.time.LocalDateTime;

import com.administracionzonal.enums.EstadoExpedienteCompra;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ExpedienteCompraDTO {
    private Long id;
    private String titulo;
    private String objetoCompra;
    private String descripcion;
    private String referenciaOficial;
    private EstadoExpedienteCompra estado;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
    private String createdBy;
    private String updatedBy;
}
