package com.administracionzonal.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "usuarios_roles")
@IdClass(UsuarioRolId.class)
@Getter
@Setter
public class UsuarioRol {

    @Id
    private Long idUsuario;

    @Id
    private Long idRol;

    private LocalDateTime fechaAsignacion = LocalDateTime.now();
}
