package com.administracionzonal.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.ReservaCoworking;

public interface ReservaRepository extends JpaRepository<ReservaCoworking, Long> {

    @Query("SELECT COUNT(r) FROM ReservaCoworking r " +
            "WHERE r.nombreArea = :nombreArea " +
            "AND r.fecha = :fecha " +
            "AND r.horaInicio < :horaFin " +
            "AND r.horaFin > :horaInicio")
    long contarReservasSimultaneas(
            @Param("nombreArea") String nombreArea,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin);

    @Query("""
                SELECT COUNT(r) FROM ReservaCoworking r
                WHERE r.usuario.cedula = :cedula
                AND r.fecha BETWEEN :inicio AND :fin
                AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO'))
                AND r.noAsistio = false
            """)
    long contarReservasActivasDelMes(
            @Param("cedula") String cedula,
            @Param("inicio") LocalDate inicio,
            @Param("fin") LocalDate fin);

    @Query("""
                SELECT r FROM ReservaCoworking r
                WHERE r.nombreArea = :nombreArea
                AND r.fecha = :fecha
                AND (r.estado IS NULL OR r.estado NOT IN ('CANCELADO', 'CANCELADA', 'RECHAZADO', 'NO_ASISTIO'))
                AND r.noAsistio = false
            """)
    List<ReservaCoworking> findByAreaAndFecha(
            @Param("nombreArea") String nombreArea,
            @Param("fecha") LocalDate fecha);

    @Query("""
                SELECT r FROM ReservaCoworking r
                WHERE r.fecha = :fecha
                AND r.noAsistio = false
            """)
    List<ReservaCoworking> findActivasHoy(LocalDate fecha);

    Optional<ReservaCoworking> findByQrToken(String qrToken);

    List<ReservaCoworking> findByUsuario_Cedula(String cedula, Sort sort);

    List<ReservaCoworking> findByUsuario_CedulaAndFechaBetween(
            String cedula,
            LocalDate inicio,
            LocalDate fin);

    long countByUsuario_CedulaAndNoAsistioTrue(String cedula);

    List<ReservaCoworking> findByFechaAndNoAsistioFalse(LocalDate fecha);

    List<ReservaCoworking> findByFechaLessThanEqualAndNoAsistioFalse(LocalDate fecha);
}