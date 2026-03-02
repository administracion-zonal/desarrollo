package com.administracionzonal.repository;

import com.administracionzonal.entity.UsuarioInstitucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioInstitucionRepository
        extends JpaRepository<UsuarioInstitucion, Long> {
}
