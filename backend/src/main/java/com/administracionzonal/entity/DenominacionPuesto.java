package com.administracionzonal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "denominacion_puesto", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DenominacionPuesto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_denominacion")
    private Long idDenominacion;

    private String nombre;

    private String descripcion;
}