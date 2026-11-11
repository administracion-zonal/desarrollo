package com.administracionzonal.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.SolicitudDesbloqueoCancha;

public interface SolicitudDesbloqueoCanchaRepository
        extends JpaRepository<SolicitudDesbloqueoCancha, Long> {

    List<SolicitudDesbloqueoCancha> findByEstadoOrderByFechaSolicitudDescIdDesc(String estado);

    Optional<SolicitudDesbloqueoCancha> findTopByUsuario_CedulaOrderByFechaSolicitudDesc(String cedula);

    boolean existsByUsuario_CedulaAndEstado(String cedula, String estado);
}
