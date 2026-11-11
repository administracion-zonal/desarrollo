package com.administracionzonal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.UsuarioProceso;

public interface UsuarioProcesoRepository extends JpaRepository<UsuarioProceso, Long> {

    List<UsuarioProceso> findByIdUsuario(Long idUsuario);

    List<UsuarioProceso> findByIdUsuarioAndTipoAndEstado(
            Long idUsuario, String tipo, String estado);

    List<UsuarioProceso> findByIdUsuarioAndEstado(Long idUsuario, String estado);
}