package com.administracionzonal.repository;

import java.util.Optional;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.UsuarioInstitucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioInstitucionRepository
        extends JpaRepository<UsuarioInstitucion, Long> {

        Optional<UsuarioInstitucion> findByUsuario(Usuario usuario);

}
