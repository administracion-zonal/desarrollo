package com.administracionzonal.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;

public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    Optional<Vehiculo> findByChoferIdUsuario(Long idUsuario);

    @Query("""
                SELECT DISTINCT u
                FROM Vehiculo v
                JOIN v.chofer u
                JOIN u.roles r
                WHERE r.nombre = 'CHOFER'
            """)
    List<Usuario> findChoferes(Sort sort);
}