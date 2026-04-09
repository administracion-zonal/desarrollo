package com.administracionzonal.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.SolicitudVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.enums.EstadoSolicitud;

public interface SolicitudVehiculoRepository extends JpaRepository<SolicitudVehiculo, Long> {

    // Validar que el usuario no tenga otra solicitud en ese horario
    boolean existsByUsuarioAndFechaAndHoraInicioLessThanEqualAndHoraFinGreaterThanEqual(
            Usuario usuario,
            LocalDate fecha,
            LocalTime horaFin,
            LocalTime horaInicio);

    // Contar solicitudes aprobadas (para después)
    int countByFechaAndHoraInicioLessThanEqualAndHoraFinGreaterThanEqualAndEstado(
            LocalDate fecha,
            LocalTime horaFin,
            LocalTime horaInicio,
            com.administracionzonal.enums.EstadoSolicitud estado);

    List<SolicitudVehiculo> findByEstado(EstadoSolicitud estado);
}