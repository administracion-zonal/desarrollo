package com.administracionzonal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.UsuarioProceso;

public interface UsuarioProcesoRepository extends JpaRepository<UsuarioProceso, Long> {

    List<UsuarioProceso> findByIdUsuario(Long idUsuario);
}