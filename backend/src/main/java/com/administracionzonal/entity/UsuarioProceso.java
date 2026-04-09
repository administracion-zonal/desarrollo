package com.administracionzonal.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "usuario_proceso", schema = "administracionzonal")
@Data
public class UsuarioProceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuarioProceso;

    private Long idUsuario;
    private String tipo; // INGRESO / SALIDA
    private String estado; // EN_PROCESO / COMPLETADO

    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
}