package com.administracionzonal.entity;

import java.time.LocalDateTime;

import com.administracionzonal.enums.EstadoExpedienteCompra;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expedientes_compras", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
public class ExpedienteCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_expediente")
    private Long id;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(name = "objeto_compra", nullable = false, columnDefinition = "text")
    private String objetoCompra;

    @Column(columnDefinition = "text")
    private String descripcion;

    @Column(name = "referencia_oficial", length = 200)
    private String referenciaOficial;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoExpedienteCompra estado;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;
}
