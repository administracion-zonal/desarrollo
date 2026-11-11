package com.administracionzonal.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.ReservaCancha;

public interface ReservaCanchaRepository extends JpaRepository<ReservaCancha, Long> {

    List<ReservaCancha> findByUsuario_Cedula(String cedula, Sort sort);

    List<ReservaCancha> findByUsuario_CedulaAndFecha(String cedula, LocalDate fecha);

    @Query("""
            SELECT COUNT(r) FROM ReservaCancha r
            WHERE r.usuario.cedula = :cedula
              AND r.fecha = :fecha
              AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO'))
            """)
    long countActivasPorUsuarioYFecha(
            @Param("cedula") String cedula,
            @Param("fecha") LocalDate fecha);

    @Query("""
            SELECT COUNT(r) FROM ReservaCancha r
            WHERE r.usuario.cedula = :cedula
              AND r.fecha BETWEEN :inicio AND :fin
              AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO'))
            """)
    long countActivasPorUsuarioEntreFechas(
            @Param("cedula") String cedula,
            @Param("inicio") LocalDate inicio,
            @Param("fin") LocalDate fin);

    List<ReservaCancha> findByUsuario_CedulaAndFechaBetween(
            String cedula,
            LocalDate inicio,
            LocalDate fin);

    long countByUsuario_CedulaAndNoAsistioTrue(String cedula);

    long countByUsuario_CedulaAndFechaBetweenAndNoAsistioTrue(
            String cedula,
            LocalDate inicio,
            LocalDate fin);

    @Query("""
            SELECT COUNT(r) > 0 FROM ReservaCancha r
            WHERE r.usuario.cedula = :cedula
              AND r.fecha = :fecha
              AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO'))
            """)
    boolean existsReservaActivaPorUsuarioYFecha(
            @Param("cedula") String cedula,
            @Param("fecha") LocalDate fecha);

    List<ReservaCancha> findByFecha(LocalDate fecha);

    @Query("""
            SELECT r FROM ReservaCancha r
            WHERE r.fecha = :fecha
              AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO', 'NO_ASISTIO'))
            """)
    List<ReservaCancha> findReservasActivasPorFecha(@Param("fecha") LocalDate fecha);

    List<ReservaCancha> findByEstadoAndFechaLessThanEqual(String estado, LocalDate fecha);

    Optional<ReservaCancha> findByQrToken(String qrToken);
}