package com.administracionzonal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "direccion", schema = "administracionzonal")
@Getter
@Setter
public class Direccion {

    @Id
    @Column(name = "id_direccion")
    private Long idDireccion;

    private String nombre;
    private String descripcion;
}