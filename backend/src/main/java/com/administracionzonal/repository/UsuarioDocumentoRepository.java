package com.administracionzonal.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.UsuarioDocumento;

public interface UsuarioDocumentoRepository extends JpaRepository<UsuarioDocumento, Long> {
    List<UsuarioDocumento> findByIdUsuario(Long idUsuario);

    Optional<UsuarioDocumento> findByIdUsuarioAndDocumentoTipo_IdDocumentoTipo(
            Long idUsuario,
            Long idDocumentoTipo);
}
