package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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

        validarFechaHoraSolicitud(fecha, horaInicio, horaFin);
        validarPermisoSolicitudVehiculo(usuario);

        boolean extraoficial = esReservaExtraoficial(horaInicio, horaFin);

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
        s.setMotivo(extraoficial
                ? "[EXTRAOFICIAL - REQUIERE AUTORIZACION ADMINISTRADOR ZONAL] " + motivo
                : motivo);
        s.setDestino(destino);
        s.setObservaciones(observaciones);
        s.setOrigen(origen);
        s.setServidores(servidores);
        s.setEstado(EstadoSolicitud.PENDIENTE);
        s.setCreatedAt(LocalDateTime.now());
        s.setUpdatedAt(LocalDateTime.now());
        s.setCreatedBy(usuario.getCedula());
        s.setUpdatedBy(usuario.getCedula());

        return repo.save(s);
    }

    @SuppressWarnings("null")
    public void aprobarSolicitud(Long idSolicitud, Long idChofer, String cedulaAprobador) {
        if (idSolicitud == null || idChofer == null) {
            throw new RuntimeException("ID de solicitud y chofer son obligatorios");

        }
        SolicitudVehiculo solicitud = repo.findById(idSolicitud)
                .orElseThrow();

        validarAprobadorParaSolicitud(solicitud, cedulaAprobador);

        Usuario chofer = usuarioRepository.findById(idChofer)
                .orElseThrow();

        // 🔥 obtener vehículo del chofer
        Vehiculo vehiculo = vehiculoRepository.findByChoferIdUsuario(idChofer)
                .orElseThrow(() -> new RuntimeException("Chofer sin vehículo"));

        // 🔥 usuario desde solicitud (IMPORTANTE)
        Usuario usuario = solicitud.getUsuario();

        ReservaVehiculo reserva = ReservaVehiculo.builder()
                .usuario(usuario)
                .chofer(chofer)
                .vehiculo(vehiculo)
                .fechaReserva(solicitud.getFecha())
                .horaInicio(solicitud.getHoraInicio())
                .horaFin(solicitud.getHoraFin())
                .destino(solicitud.getDestino())
                .observaciones(construirObservacionesReserva(solicitud))
                .estado("APROBADA")
                .build();

        reservaRepository.save(reserva);

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setUpdatedAt(LocalDateTime.now());
        solicitud.setUpdatedBy(chofer.getCedula());
        repo.save(solicitud);
    }

    public SolicitudVehiculo rechazarSolicitud(Long id, String observacionRechazo) {

        if (id == null) {
            throw new RuntimeException("ID es obligatorio");
        }

        SolicitudVehiculo s = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        s.setEstado(EstadoSolicitud.RECHAZADA);
        s.setObservacionRechazo(observacionRechazo);
        s.setUpdatedAt(LocalDateTime.now());

        if (s.getUsuario() != null) {
            s.setUpdatedBy(s.getUsuario().getCedula());
        }

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
                    dto.setObservaciones(s.getObservaciones());
                    dto.setOrigen(s.getOrigen());
                    dto.setServidores(s.getServidores());
                    dto.setObservacionRechazo(s.getObservacionRechazo());
                    dto.setCreatedAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
                    dto.setUpdatedAt(s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null);
                    dto.setCreatedBy(s.getCreatedBy());
                    dto.setUpdatedBy(s.getUpdatedBy());

                    dto.setEstado(s.getEstado().name());

                    dto.setNombres(s.getUsuario().getNombres());
                    dto.setCedula(s.getUsuario().getCedula());

                    return dto;
                })
                .toList();
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
                    dto.setOrigen(r.getOrigen());
                    dto.setServidores(r.getServidores());
                    dto.setObservacionRechazo(r.getObservacionRechazo());
                    dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
                    dto.setUpdatedAt(r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null);
                    dto.setCreatedBy(r.getCreatedBy());
                    dto.setUpdatedBy(r.getUpdatedBy());
                    dto.setEstado(r.getEstado().name());
                    dto.setNombres(r.getUsuario().getNombres());
                    dto.setCedula(r.getUsuario().getCedula());

                    return dto;
                })
                .toList();
    }

    private String construirObservacionesReserva(SolicitudVehiculo solicitud) {
        StringBuilder detalle = new StringBuilder();

        if (solicitud.getMotivo() != null && !solicitud.getMotivo().isBlank()) {
            detalle.append("Motivo: ").append(solicitud.getMotivo().trim());
        }

        if (solicitud.getOrigen() != null && !solicitud.getOrigen().isBlank()) {
            appendLinea(detalle, "Origen: " + solicitud.getOrigen().trim());
        }

        if (solicitud.getServidores() != null && !solicitud.getServidores().isBlank()) {
            appendLinea(detalle, "Servidores: " + solicitud.getServidores().trim());
        }

        if (solicitud.getObservaciones() != null && !solicitud.getObservaciones().isBlank()) {
            appendLinea(detalle, "Observaciones: " + solicitud.getObservaciones().trim());
        }

        return detalle.isEmpty() ? null : detalle.toString();
    }

    private void appendLinea(StringBuilder detalle, String linea) {
        if (detalle.length() > 0) {
            detalle.append("\n");
        }
        detalle.append(linea);
    }

    private void validarFechaHoraSolicitud(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (fecha.isBefore(hoy)) {
            throw new RuntimeException("No puede solicitar reservas en fechas pasadas");
        }

        if (!horaFin.isAfter(horaInicio)) {
            throw new RuntimeException("La hora fin debe ser mayor a la hora inicio");
        }

        if (horaFin.isAfter(LocalTime.of(16, 0))) {
            throw new RuntimeException("La hora máxima de retorno permitida es 16:00");
        }

        if (fecha.isEqual(hoy) && !horaInicio.isAfter(ahora)) {
            throw new RuntimeException("No puede solicitar horarios pasados");
        }
    }

    private void validarPermisoSolicitudVehiculo(Usuario usuario) {
        boolean esAdmin = usuario.getRoles().stream()
                .map(r -> r.getNombre())
                .anyMatch(nombre -> "ADMIN".equals(nombre) || "ADMIN_VEHICULOS".equals(nombre));

        boolean esServidorAzvch = usuario.getRoles().stream()
                .map(r -> r.getNombre())
                .anyMatch("SERVIDOR_AZVCH"::equals);

        if (!esServidorAzvch || esAdmin) {
            return;
        }

        UsuarioInstitucion ui = usuarioInstitucionRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("No existe perfil institucional del usuario"));

        String denominacion = ui.getDenominacion() != null ? ui.getDenominacion().getNombre() : null;

        if (denominacion == null || !denominacion.toUpperCase().contains("JEFE")) {
            throw new RuntimeException("Solo perfiles con denominacion JEFE pueden solicitar vehiculo");
        }
    }

    private void validarAprobadorParaSolicitud(SolicitudVehiculo solicitud, String cedulaAprobador) {
        if (cedulaAprobador == null || cedulaAprobador.isBlank()) {
            throw new RuntimeException("No se pudo validar el aprobador");
        }

        boolean esExtraoficial = solicitud.getMotivo() != null
                && solicitud.getMotivo().startsWith("[EXTRAOFICIAL");

        if (!esExtraoficial) {
            return;
        }

        Usuario aprobador = usuarioRepository.findByCedula(cedulaAprobador)
                .orElseThrow(() -> new RuntimeException("Aprobador no encontrado"));

        UsuarioInstitucion ui = usuarioInstitucionRepository.findByUsuario(aprobador)
                .orElseThrow(() -> new RuntimeException("Aprobador sin perfil institucional"));

        String denominacion = ui.getDenominacion() != null ? ui.getDenominacion().getNombre() : null;

        if (denominacion == null
                || !denominacion.toUpperCase().contains("ADMINISTRADOR ZONAL VALLE DE LOS CHILLOS")) {
            throw new RuntimeException(
                    "Solo el perfil ADMINISTRADOR ZONAL VALLE DE LOS CHILLOS puede aprobar solicitudes extraoficiales");
        }
    }

    private boolean esReservaExtraoficial(LocalTime horaInicio, LocalTime horaFin) {
        LocalTime inicioNormal = LocalTime.of(8, 0);
        LocalTime finNormal = LocalTime.of(15, 30);

        return horaInicio.isBefore(inicioNormal) || horaFin.isAfter(finNormal);
    }

}
