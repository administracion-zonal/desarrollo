package com.administracionzonal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rol")
    private Long idRol;

    @Column(name = "nombre", nullable = false, unique = true)
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;
}
