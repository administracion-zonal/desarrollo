package com.administracionzonal.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.OrdenMovilizacion;

public interface OrdenMovilizacionRepository extends JpaRepository<OrdenMovilizacion, Long> {

    Optional<OrdenMovilizacion> findByReserva_IdReserva(Long idReserva);
}