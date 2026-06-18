package com.administracionzonal.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "orden_movilizacion")
@Getter
@Setter
public class OrdenMovilizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOrdenMovilizacion;

    @ManyToOne
    @JoinColumn(name = "id_reserva")
    private ReservaVehiculo reserva;

    @ManyToOne
    @JoinColumn(name = "id_autorizado")
    private Usuario autorizado;

    private String codigo;

    private LocalDate fechaEmision;

    private String estado;
}