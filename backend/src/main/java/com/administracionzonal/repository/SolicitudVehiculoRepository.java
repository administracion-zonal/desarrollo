package com.administracionzonal.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.SolicitudVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.enums.EstadoSolicitud;

public interface SolicitudVehiculoRepository extends JpaRepository<SolicitudVehiculo, Long> {

        // Validar que el usuario no tenga otra solicitud en ese horario
        @Query("""
                        SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
                        FROM SolicitudVehiculo s
                        WHERE s.usuario = :usuario
                        AND s.fecha = :fecha
                        AND s.estado IN :estados
                        AND s.horaInicio < :horaFin
                        AND s.horaFin > :horaInicio
                        """)
        boolean existsSolicitudEnHorario(
                        @Param("usuario") Usuario usuario,
                        @Param("fecha") LocalDate fecha,
                        @Param("horaInicio") LocalTime horaInicio,
                        @Param("horaFin") LocalTime horaFin,
                        @Param("estados") List<EstadoSolicitud> estados);

        // Contar solicitudes aprobadas (para después)
        int countByFechaAndHoraInicioLessThanEqualAndHoraFinGreaterThanEqualAndEstado(
                        LocalDate fecha,
                        LocalTime horaFin,
                        LocalTime horaInicio,
                        com.administracionzonal.enums.EstadoSolicitud estado);

        List<SolicitudVehiculo> findByEstado(EstadoSolicitud estado, Sort sort);

        List<SolicitudVehiculo> findByUsuario_Cedula(String cedula, Sort sort);
}
