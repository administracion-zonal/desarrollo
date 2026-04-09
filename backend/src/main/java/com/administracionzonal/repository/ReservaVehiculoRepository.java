package com.administracionzonal.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.ReservaVehiculo;

public interface ReservaVehiculoRepository extends JpaRepository<ReservaVehiculo, Long> {

    @Query("""
                SELECT r FROM ReservaVehiculo r
                WHERE r.idVehiculo = :vehiculo
                AND r.fechaReserva = :fecha
                AND (
                    (r.horaInicio <= :horaFin AND r.horaFin >= :horaInicio)
                )
            """)
    List<ReservaVehiculo> validarDisponibilidad(
            @Param("vehiculo") Long vehiculo,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin);

    @Query("""
                SELECT r FROM ReservaVehiculo r
                WHERE r.idVehiculo = :idVehiculo
                AND r.fechaReserva = :fecha
                AND r.estado <> 'RECHAZADO'
            """)
    List<ReservaVehiculo> findByIdVehiculoAndFechaReserva(
            @Param("idVehiculo") Long idVehiculo,
            @Param("fecha") LocalDate fecha);

    List<ReservaVehiculo> findByUsuarioIdUsuario(Long idUsuario);

    List<ReservaVehiculo> findByChoferIdUsuario(Long idChofer);

    List<ReservaVehiculo> findByUsuarioIdUsuarioAndEstado(Long idUsuario, String estado);

}
