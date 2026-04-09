package com.administracionzonal.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.ReservaCancha;

public interface ReservaCanchaRepository extends JpaRepository<ReservaCancha, Long> {

    List<ReservaCancha> findByUsuario_Cedula(String cedula);

    List<ReservaCancha> findByUsuario_CedulaAndFecha(String cedula, LocalDate fecha);

    List<ReservaCancha> findByUsuario_CedulaAndFechaBetween(
            String cedula,
            LocalDate inicio,
            LocalDate fin);

    boolean existsByUsuario_CedulaAndFecha(String cedula, LocalDate fecha);

    List<ReservaCancha> findByFecha(LocalDate fecha);

    Optional<ReservaCancha> findByQrToken(String qrToken);
}