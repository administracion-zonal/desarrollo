package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.dto.SolicitudVehiculoDTO;
import com.administracionzonal.dto.SolicitudVehiculoRequest;
import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.SolicitudVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.UsuarioInstitucion;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.enums.EstadoSolicitud;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.SolicitudVehiculoRepository;
import com.administracionzonal.repository.UsuarioInstitucionRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.repository.VehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SolicitudVehiculoService {

    private final SolicitudVehiculoRepository repo;

    private final UsuarioRepository usuarioRepository;
    private final UsuarioInstitucionRepository usuarioInstitucionRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ReservaVehiculoRepository reservaRepository;
    private final OrdenMovilizacionService ordenMovilizacionService;

    private static final LocalTime HORA_MINIMA = LocalTime.of(0, 1);
    private static final LocalTime HORA_MAXIMA_SOLICITUD = LocalTime.of(11, 59);

    private record ElegibilidadSolicitante(boolean director, boolean jefe) {
    }

    public SolicitudVehiculo crearSolicitud(
            Usuario usuario,
            LocalDate fecha,
            LocalTime horaInicio,
            LocalTime horaFin,
            String motivo,
            String destino,
            String observaciones,
            String origen,
            String servidores) {

        ElegibilidadSolicitante elegibilidad = validarSolicitante(usuario);
        if (!elegibilidad.director() && !elegibilidad.jefe()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo director o jefe de unidad de la AZVCH puede solicitar vehículos");
        }

        if (horaInicio == null || horaFin == null || !horaFin.isAfter(horaInicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Horario inválido");
        }

        boolean fueraHorario = horaInicio.isBefore(HORA_MINIMA) || horaFin.isAfter(HORA_MAXIMA_SOLICITUD);
        if (fueraHorario) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El horario permitido es desde 00:01 hasta 11:59");
        }

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
        s.setDestino(destino);
        s.setObservaciones(observaciones);
        s.setOrigen(origen);
        s.setServidores(servidores);
        s.setEstado(EstadoSolicitud.PENDIENTE);

        return repo.save(s);
    }

    @SuppressWarnings("null")
    @Transactional
    public void aprobarSolicitud(Long idSolicitud, Long idChofer, Usuario aprobador) {
        if (idSolicitud == null || idChofer == null) {
            throw new RuntimeException("ID de solicitud y chofer son obligatorios");

        }

        if (aprobador == null) {
            throw new RuntimeException("Aprobador obligatorio");
        }

        SolicitudVehiculo solicitud = repo.findById(idSolicitud)
                .orElseThrow();

        if (solicitud.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden aprobar solicitudes en estado PENDIENTE");
        }

        ElegibilidadSolicitante elegibilidad = validarSolicitante(solicitud.getUsuario());
        validarAprobadorSegunJerarquia(aprobador, elegibilidad, solicitud.getHoraInicio(), solicitud.getHoraFin());

        Usuario chofer = usuarioRepository.findById(idChofer)
                .orElseThrow();

        boolean choferOcupado = reservaRepository
                .existsByChoferIdUsuarioAndFechaReservaAndHoraInicioLessThanEqualAndHoraFinGreaterThanEqualAndEstado(
                        idChofer,
                        solicitud.getFecha(),
                        solicitud.getHoraFin(),
                        solicitud.getHoraInicio(),
                        "APROBADA");

        if (choferOcupado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El chofer seleccionado ya tiene una reserva aprobada en ese horario");
        }

        // 🔥 obtener vehículo del chofer
        Vehiculo vehiculo = vehiculoRepository.findByChoferIdUsuario(idChofer)
                .orElseThrow(() -> new RuntimeException("Chofer sin vehículo"));

        // 🔥 usuario desde solicitud (IMPORTANTE)
        Usuario usuario = solicitud.getUsuario();

        ReservaVehiculo reserva = ReservaVehiculo.builder()
                .usuario(usuario)
                .chofer(chofer)
                .vehiculo(vehiculo)
                .solicitud(solicitud)
                .fechaReserva(solicitud.getFecha())
                .horaInicio(solicitud.getHoraInicio())
                .horaFin(solicitud.getHoraFin())
                .destino(solicitud.getDestino())
                .observaciones(solicitud.getObservaciones())
                .estado("APROBADA")
                .estadoViaje("PENDIENTE")
                .noSePresento(false)
                .build();

        ReservaVehiculo reservaGuardada = reservaRepository.save(reserva);

        // Pre-crea el codigo correlativo de la orden para que exista desde la
        // aprobación.
        ordenMovilizacionService.asegurarOrdenMovilizacion(
                reservaGuardada.getIdReserva(),
                aprobador.getCedula());

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        repo.save(solicitud);
    }

    public SolicitudVehiculo rechazarSolicitud(Long id, String observacion, Usuario aprobador) {

        if (id == null) {
            throw new RuntimeException("ID es obligatorio");
        }

        if (observacion == null || observacion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La observación de rechazo es obligatoria");
        }

        if (aprobador == null) {
            throw new RuntimeException("Aprobador obligatorio");
        }

        SolicitudVehiculo s = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (s.getEstado() != EstadoSolicitud.PENDIENTE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden rechazar solicitudes en estado PENDIENTE");
        }

        ElegibilidadSolicitante elegibilidad = validarSolicitante(s.getUsuario());
        validarAprobadorSegunJerarquia(aprobador, elegibilidad, s.getHoraInicio(), s.getHoraFin());

        s.setEstado(EstadoSolicitud.RECHAZADA);
        s.setObservacionRechazo(observacion.trim());

        return repo.save(s);
    }

    public List<SolicitudVehiculo> listarSolicitudes() {
        return repo.findAll();
    }

    public List<SolicitudVehiculoDTO> listarPendientes() {

        return repo.findByEstado(EstadoSolicitud.PENDIENTE)
                .stream()
                .map(s -> {
                    SolicitudVehiculoDTO dto = new SolicitudVehiculoDTO();

                    dto.setId(s.getId());
                    dto.setFecha(s.getFecha().toString());
                    dto.setHoraInicio(s.getHoraInicio().toString());
                    dto.setHoraFin(s.getHoraFin().toString());

                    dto.setDestino(s.getDestino());
                    dto.setMotivo(s.getMotivo());

                    dto.setEstado(s.getEstado().name());

                    dto.setNombres(s.getUsuario().getNombres());
                    dto.setCedula(s.getUsuario().getCedula());

                    return dto;
                })
                .toList();
    }

    private ElegibilidadSolicitante validarSolicitante(Usuario usuario) {
        UsuarioInstitucion ui = usuarioInstitucionRepository.findByUsuario(usuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "El usuario no tiene información institucional"));

        String institucion = (ui.getInstitucion() != null ? ui.getInstitucion() : "").toUpperCase(Locale.ROOT);
        if (!institucion.contains("VALLE") || !institucion.contains("CHILLOS")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo personal de la Administración Zonal Valle de los Chillos puede solicitar vehículos");
        }

        String cargo = ui.getDenominacion() != null && ui.getDenominacion().getNombre() != null
                ? ui.getDenominacion().getNombre().toUpperCase(Locale.ROOT)
                : "";

        boolean esDirector = cargo.contains("DIRECTOR");
        boolean esJefe = cargo.contains("JEFE");

        return new ElegibilidadSolicitante(esDirector, esJefe);
    }

    private void validarAprobadorSegunJerarquia(
            Usuario aprobador,
            ElegibilidadSolicitante solicitante,
            LocalTime horaInicio,
            LocalTime horaFin) {

        boolean esMaximaAutoridad = tieneRol(aprobador, "ADMIN");
        boolean esAdminVehiculos = tieneRol(aprobador, "ADMIN_VEHICULOS") || esMaximaAutoridad;

        boolean fueraHorario = horaInicio.isBefore(HORA_MINIMA) || horaFin.isAfter(HORA_MAXIMA_SOLICITUD);

        if (fueraHorario && !esMaximaAutoridad) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Las solicitudes fuera del horario permitido solo pueden ser aprobadas por la máxima autoridad");
        }

        if (solicitante.director() && !esMaximaAutoridad) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Las solicitudes de directores solo pueden ser aprobadas por la máxima autoridad");
        }

        if (solicitante.jefe() && !esAdminVehiculos) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Las solicitudes de jefatura deben ser aprobadas por administración de vehículos");
        }
    }

    private boolean tieneRol(Usuario usuario, String rol) {
        return usuario.getRoles().stream()
                .anyMatch(r -> rol.equalsIgnoreCase(r.getNombre()));
    }

    public List<SolicitudVehiculoRequest> listarPorUsuario(String cedula) {
        return repo.findByUsuario_Cedula(cedula)
                .stream()
                .map(r -> {
                    SolicitudVehiculoRequest dto = new SolicitudVehiculoRequest();

                    dto.setId(r.getId());
                    dto.setFecha(r.getFecha().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());
                    dto.setDestino(r.getDestino());
                    dto.setMotivo(r.getMotivo());
                    dto.setObservaciones(r.getObservaciones());
                    dto.setObservacionRechazo(r.getObservacionRechazo());
                    dto.setOrigen(r.getOrigen());
                    dto.setServidores(r.getServidores());
                    dto.setEstado(r.getEstado() != null ? r.getEstado().name() : null);

                    return dto;
                })
                .toList();
    }

}
