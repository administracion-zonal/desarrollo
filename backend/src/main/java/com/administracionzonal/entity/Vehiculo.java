package com.administracionzonal.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "vehiculos", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vehiculo {

    @Id
    private Long idVehiculo;

    private String marca;
    private String modelo;
    private String placa;
    private String anio;
    private String estado;

    @ManyToOne
    @JoinColumn(name = "id_chofer")
    private Usuario chofer;
}