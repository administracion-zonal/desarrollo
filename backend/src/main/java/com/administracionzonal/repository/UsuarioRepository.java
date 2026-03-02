package com.administracionzonal.repository;

import com.administracionzonal.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCedula(String cedula);
    boolean existsByCedula (String cedula);
    boolean existsByCorreo(String correo);
}
