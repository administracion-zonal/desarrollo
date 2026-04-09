package com.administracionzonal.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "reserva_cancha")
@Data
public class ReservaCancha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private LocalDate fecha;

    private LocalTime horaInicio;
    private LocalTime horaFin;

    private String qrToken;

    private boolean usado;
    private boolean asistio;
    private boolean noAsistio;
    private String estado; // "pendiente", "confirmada", "cancelada"
}