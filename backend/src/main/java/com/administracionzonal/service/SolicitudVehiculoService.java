package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.SolicitudVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.enums.EstadoSolicitud;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.SolicitudVehiculoRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.repository.VehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SolicitudVehiculoService {

    private final SolicitudVehiculoRepository repo;

    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ReservaVehiculoRepository reservaRepository;

    public SolicitudVehiculo crearSolicitud(
            Usuario usuario,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin,
            String motivo) {

        // 🔴 VALIDAR QUE NO TENGA OTRA SOLICITUD EN ESE HORARIO
        boolean existe = repo.existsByUsuarioAndFechaAndHoraInicioLessThanEqualAndHoraFinGreaterThanEqual(
                usuario, fecha, horaFin, horaInicio);

        if (existe) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya tienes una solicitud en ese horario");
        }

        SolicitudVehiculo s = new SolicitudVehiculo();
        s.setUsuario(usuario);
        s.setFecha(fecha);
        s.setHoraInicio(horaInicio);
        s.setHoraFin(horaFin);
        s.setMotivo(motivo);
        s.setEstado(EstadoSolicitud.PENDIENTE);

        return repo.save(s);
    }

    @SuppressWarnings("null")
    public void aprobarSolicitud(Long idSolicitud, Long idChofer) {
        if (idSolicitud == null || idChofer == null) {
            throw new RuntimeException("ID de solicitud y chofer son obligatorios");

        }
        SolicitudVehiculo solicitud = repo.findById(idSolicitud)
                .orElseThrow();

        Usuario chofer = usuarioRepository.findById(idChofer)
                .orElseThrow();

        // 🔥 obtener vehículo del chofer
        Vehiculo vehiculo = vehiculoRepository.findByChoferIdUsuario(idChofer)
                .orElseThrow(() -> new RuntimeException("Chofer sin vehículo"));

        // 🔥 usuario desde solicitud (IMPORTANTE)
        Usuario usuario = solicitud.getUsuario();

        ReservaVehiculo reserva = ReservaVehiculo.builder()
                .usuario(usuario) // 🔥 ESTO EVITA TU ERROR
                .chofer(chofer)
                .idVehiculo(vehiculo.getIdVehiculo())
                .fechaReserva(solicitud.getFecha())
                .horaInicio(solicitud.getHoraInicio())
                .horaFin(solicitud.getHoraFin())
                .destino(solicitud.getMotivo())
                .estado("APROBADA")
                .build();

        reservaRepository.save(reserva);

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        repo.save(solicitud);
    }

    public SolicitudVehiculo rechazarSolicitud(Long id) {

        if (id == null) {
            throw new RuntimeException("ID es obligatorio");
        }

        SolicitudVehiculo s = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        s.setEstado(EstadoSolicitud.RECHAZADA);

        return repo.save(s);
    }

    public List<SolicitudVehiculo> listarSolicitudes() {
        return repo.findAll();
    }

    public List<SolicitudVehiculo> listarPendientes() {
        return repo.findAll().stream()
                .filter(s -> s.getEstado() == EstadoSolicitud.PENDIENTE)
                .toList();
    }

}