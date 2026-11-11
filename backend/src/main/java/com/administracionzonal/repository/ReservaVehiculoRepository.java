package com.administracionzonal.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.ReservaVehiculo;

public interface ReservaVehiculoRepository extends JpaRepository<ReservaVehiculo, Long> {

    @Query("""
                SELECT r FROM ReservaVehiculo r
                WHERE r.vehiculo.idVehiculo = :vehiculo
                AND r.fechaReserva = :fecha
                AND COALESCE(r.estado, '') NOT IN ('RECHAZADO', 'RECHAZADA', 'CANCELADA', 'FINALIZADA')
                AND r.horaInicio < :horaFin
                AND r.horaFin > :horaInicio
            """)
    List<ReservaVehiculo> validarDisponibilidad(
            @Param("vehiculo") Long vehiculo,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin);

    @Query("""
                SELECT r FROM ReservaVehiculo r
                WHERE r.vehiculo.idVehiculo = :idVehiculo
                AND r.fechaReserva = :fecha
                AND COALESCE(r.estado, '') NOT IN ('RECHAZADO', 'RECHAZADA', 'CANCELADA', 'FINALIZADA')
            """)
    List<ReservaVehiculo> buscarReservas(
            @Param("idVehiculo") Long idVehiculo,
            @Param("fecha") LocalDate fecha);

    List<ReservaVehiculo> findByUsuarioIdUsuarioOrderByIdReservaDesc(Long idUsuario);

    List<ReservaVehiculo> findByChoferIdUsuario(Long idChofer);

    List<ReservaVehiculo> findByChoferIdUsuarioOrderByIdReservaDesc(Long idChofer);

    List<ReservaVehiculo> findByUsuarioIdUsuarioAndEstado(Long idUsuario, String estado);

    List<ReservaVehiculo> findByVehiculo_IdVehiculoAndFechaReserva(Long idVehiculo, LocalDate fecha);

    List<ReservaVehiculo> findByEstadoAndFechaReservaLessThanEqual(String estado, LocalDate fecha);

    boolean existsByVehiculo_IdVehiculoAndFechaReservaGreaterThanEqualAndEstadoIn(
            Long idVehiculo, LocalDate fecha, Collection<String> estados);

}
