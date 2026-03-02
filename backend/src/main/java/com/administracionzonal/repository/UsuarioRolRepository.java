package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.UsuarioRol;
import com.administracionzonal.entity.UsuarioRolId;

public interface UsuarioRolRepository
        extends JpaRepository<UsuarioRol, UsuarioRolId> {
}
