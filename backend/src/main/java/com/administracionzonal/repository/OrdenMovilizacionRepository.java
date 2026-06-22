package com.administracionzonal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.OrdenMovilizacion;

public interface OrdenMovilizacionRepository extends JpaRepository<OrdenMovilizacion, Long> {

    Optional<OrdenMovilizacion> findByReserva_IdReserva(Long idReserva);

    @Query(value = """
            SELECT MAX(CAST(RIGHT(codigo, 4) AS INTEGER))
            FROM administracionzonal.orden_movilizacion
            WHERE codigo LIKE CONCAT(:prefijo, '%')
            """, nativeQuery = true)
    Integer obtenerUltimoCorrelativoPorPrefijo(@Param("prefijo") String prefijo);
}