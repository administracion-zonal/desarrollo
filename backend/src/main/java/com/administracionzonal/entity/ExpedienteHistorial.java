package com.administracionzonal.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expediente_compras_historial", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
public class ExpedienteHistorial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_expediente", nullable = false)
    private Long idExpediente;

    @Column(name = "estado_anterior", length = 30)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 30)
    private String estadoNuevo;

    @Column(columnDefinition = "text")
    private String observacion;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(nullable = false)
    private LocalDateTime fecha;
}
