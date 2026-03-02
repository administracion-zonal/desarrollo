package com.administracionzonal.repository;

import com.administracionzonal.entity.ReservaCoworking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate; 
import java.time.LocalTime; 
import java.util.List;
import java.util.Optional;
public interface ReservaRepository extends JpaRepository<ReservaCoworking,Long>{

    @Query("SELECT COUNT(r) FROM ReservaCoworking r " +
           "WHERE r.nombreArea = :nombreArea " +
           "AND r.fecha = :fecha " +
           "AND r.horaInicio < :horaFin " +
           "AND r.horaFin > :horaInicio")
    long contarReservasSimultaneas(
        @Param("nombreArea") String nombreArea,
        @Param("fecha") LocalDate fecha,
        @Param("horaInicio") LocalTime horaInicio,
        @Param("horaFin") LocalTime horaFin
    );

    @Query("""
        SELECT r FROM ReservaCoworking r
        WHERE r.nombreArea = :nombreArea
        AND r.fecha = :fecha
    """)
    List<ReservaCoworking> findByAreaAndFecha(
        @Param("nombreArea") String nombreArea,
        @Param("fecha") LocalDate fecha
    );


    @Query("""
        SELECT r FROM ReservaCoworking r
        WHERE r.fecha = :fecha
        AND r.noAsistio = false
    """)
    List<ReservaCoworking> findActivasHoy(LocalDate fecha);

    Optional<ReservaCoworking> findByQrToken(String qrToken);

    List<ReservaCoworking> findByUsuario_CedulaOrderByFechaDesc(String cedula);

}