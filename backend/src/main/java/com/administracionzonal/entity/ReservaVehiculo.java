package com.administracionzonal.entity;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reservas_vehiculos", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservaVehiculo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idReserva;

    private LocalDate fechaReserva;
    private LocalTime horaInicio;
    private LocalTime horaFin;

    private String destino;
    @Column(length = 500)
    private String observaciones;
    private String estado;
    private String estadoViaje;
    private Boolean noSePresento;

    @Column(length = 500)
    private String comentarioNoPresentacion;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "id_vehiculo")
    private Vehiculo vehiculo;

    @ManyToOne
    @JoinColumn(name = "chofer_id")
    @JsonIgnore
    private Usuario chofer;

    @ManyToOne
    @JoinColumn(name = "id_solicitud")
    private SolicitudVehiculo solicitud;
}
