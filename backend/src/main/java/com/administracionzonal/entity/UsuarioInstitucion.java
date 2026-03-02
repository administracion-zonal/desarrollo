package com.administracionzonal.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usuarios_institucion")
public class UsuarioInstitucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    private String institucion;

    private boolean activo;
}