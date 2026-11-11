package com.administracionzonal.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.dto.ReservaCanchaDTO;
import com.administracionzonal.dto.ReservaCanchaResponseDTO;
import com.administracionzonal.dto.ReservaCanchaUsuarioDTO;
import com.administracionzonal.entity.ReservaCancha;
import com.administracionzonal.entity.SolicitudDesbloqueoCancha;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.ReservaCanchaRepository;
import com.administracionzonal.repository.SolicitudDesbloqueoCanchaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservaCanchaService {

    private final ReservaCanchaRepository repo;
    private final SolicitudDesbloqueoCanchaRepository desbloqueoRepo;
    private final UsuarioService usuarioService;

    private static final LocalTime HORA_MIN = LocalTime.of(6, 0);
    private static final LocalTime HORA_MAX = LocalTime.of(20, 0);

    @Transactional
    public ReservaCanchaResponseDTO crearReserva(ReservaCanchaDTO dto) {

        validarFechaHoraReserva(dto.getFecha(), dto.getHoraInicio(), dto.getHoraFin());

        Usuario usuario = usuarioService.obtenerOcrearUsuario(
                dto.getCedula(),
                dto.getNombres(),
                dto.getNombreInstitucion(),
                dto.getCorreo());

        if (Boolean.TRUE.equals(usuario.getCanchaBloqueado())) {
            throw new IllegalStateException(
                    "Su cuenta está bloqueada para reservas de cancha. Solicite la revisión de un administrador.");
        }

        /* ================= REGLA 1: SOLO 1 POR DÍA ================= */
        if (repo.countActivasPorUsuarioYFecha(usuario.getCedula(), dto.getFecha()) > 0) {
            throw new RuntimeException("Solo puede reservar una vez al día");
        }

        /* ================= REGLA 2: MÁXIMO 5 AL MES ================= */
        LocalDate inicioMes = dto.getFecha().withDayOfMonth(1);
        LocalDate finMes = dto.getFecha().withDayOfMonth(
                dto.getFecha().lengthOfMonth());

        if (repo.countActivasPorUsuarioEntreFechas(usuario.getCedula(), inicioMes, finMes) >= 5) {
            throw new RuntimeException("Máximo 5 reservas al mes");
        }

        /* ================= REGLA 3: MÁXIMO 2 HORAS ================= */
        long minutos = Duration
                .between(dto.getHoraInicio(), dto.getHoraFin())
                .toMinutes();

        if (minutos <= 0 || minutos > 120 || minutos % 30 != 0
                || dto.getHoraInicio().getMinute() % 30 != 0
                || dto.getHoraFin().getMinute() % 30 != 0) {
            throw new IllegalArgumentException("La reserva debe durar hasta 2 horas en bloques de 30 minutos");
        }

        if (repo.findReservasActivasPorFecha(dto.getFecha()).stream()
                .anyMatch(r -> solapa(
                        dto.getHoraInicio(), dto.getHoraFin(), r.getHoraInicio(), r.getHoraFin()))) {
            throw new RuntimeException("El horario seleccionado ya no está disponible");
        }

        /* ================= CREAR ================= */
        ReservaCancha r = new ReservaCancha();

        r.setUsuario(usuario);
        r.setFecha(dto.getFecha());
        r.setHoraInicio(dto.getHoraInicio());
        r.setHoraFin(dto.getHoraFin());
        r.setQrToken(UUID.randomUUID().toString());
        r.setEstado("RESERVADO");
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        r.setCreatedBy(usuario.getCedula());
        r.setUpdatedBy(usuario.getCedula());
        return mapearReserva(repo.save(r));
    }

    public List<ReservaCanchaResponseDTO> listarTodas() {
        actualizarEstados();
        return repo.findAll(Sort.by(
                        Sort.Order.desc("createdAt").nullsLast(),
                        Sort.Order.desc("id")))
                .stream()
                .map(this::mapearReserva)
                .toList();
    }

    public List<ReservaCanchaUsuarioDTO> listarReservasUsuario(String cedula) {
        actualizarEstados();
        return repo.findByUsuario_Cedula(cedula, Sort.by(
                        Sort.Order.desc("createdAt").nullsLast(),
                        Sort.Order.desc("id")))
                .stream()
                .map(r -> {
                    ReservaCanchaUsuarioDTO dto = new ReservaCanchaUsuarioDTO();

                    dto.setId(r.getId());
                    dto.setFecha(r.getFecha().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());
                    dto.setEstado(r.getEstado());
                    dto.setVigente("RESERVADO".equals(r.getEstado()));
                    dto.setPuedeCancelar("RESERVADO".equals(r.getEstado()));
                    if ("RESERVADO".equals(r.getEstado())) {
                        dto.setQrToken(r.getQrToken());
                    }

                    return dto;
                })
                .toList();
    }

    public Map<String, Object> obtenerDisponibilidad(LocalDate fecha, String cedula) {

        List<ReservaCancha> reservas = repo.findReservasActivasPorFecha(fecha);

        List<String> horasOcupadas = reservas.stream()
                .flatMap(r -> {
                    List<String> horas = new ArrayList<>();

                    LocalTime inicio = r.getHoraInicio();
                    LocalTime fin = r.getHoraFin();

                    while (inicio.isBefore(fin)) {
                        horas.add(inicio.toString());
                        inicio = inicio.plusMinutes(30);
                    }

                    return horas.stream();
                })
                .toList();

        boolean bloqueado = false;
        boolean usuarioBloqueado = false;

        if (cedula != null) {
            bloqueado = repo.existsReservaActivaPorUsuarioYFecha(cedula, fecha);
            usuarioBloqueado = usuarioService.obtenerPorCedula(cedula)
                    .map(usuario -> Boolean.TRUE.equals(usuario.getCanchaBloqueado()))
                    .orElse(false);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("horas", horasOcupadas);
        response.put("bloqueado", bloqueado);
        response.put("canchaBloqueado", usuarioBloqueado);

        return response;
    }

    public void actualizarEstados() {

        List<ReservaCancha> reservas = repo.findByEstadoAndFechaLessThanEqual("RESERVADO", LocalDate.now());

        LocalDateTime ahora = LocalDateTime.now();

        for (ReservaCancha r : reservas) {

            if (r.getEstado() == null || !r.getEstado().equals("RESERVADO"))
                continue;

            // 🔥 Combinar fecha + hora fin
            LocalDateTime finReserva = LocalDateTime.of(
                    r.getFecha(),
                    r.getHoraFin());

            // 🔥 margen de 10 minutos
            LocalDateTime limite = finReserva.plusMinutes(10);

            // 🔥 VALIDACIÓN CORRECTA
            if (ahora.isAfter(limite)) {
                r.setEstado("NO_ASISTIO");
                r.setNoAsistio(true);
                r.setUpdatedAt(LocalDateTime.now());
                r.setUpdatedBy("sistema");
                repo.save(r);

                LocalDate inicioMesReserva = r.getFecha().withDayOfMonth(1);
                LocalDate finMesReserva = r.getFecha().withDayOfMonth(
                        r.getFecha().lengthOfMonth());
                long faltasDelMes = repo.countByUsuario_CedulaAndFechaBetweenAndNoAsistioTrue(
                        r.getUsuario().getCedula(),
                        inicioMesReserva,
                        finMesReserva);
                if (faltasDelMes >= 2 && !Boolean.TRUE.equals(r.getUsuario().getCanchaBloqueado())) {
                    r.getUsuario().setCanchaBloqueado(true);
                    r.getUsuario().setMotivoBloqueoCancha(
                            "Bloqueo automático por dos inasistencias a canchas en el mes");
                    usuarioService.save(r.getUsuario());
                }
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Ejecutar cada minuto
    public void tareaEstados() {
        actualizarEstados();
    }

    public String validarQR(String token) {
        actualizarEstados();

        ReservaCancha r = repo.findByQrToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "QR inválido"));

        // Solo si está en estado RESERVADO
        if (!"RESERVADO".equals(r.getEstado())) {
            return "ERROR: Reserva ya utilizada o expirada";
        }

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        // Validar que esté dentro del horario
        if (!r.getFecha().isEqual(hoy) ||
                ahora.isBefore(r.getHoraInicio().minusMinutes(10)) ||
                ahora.isAfter(r.getHoraFin().plusMinutes(10))) {

            return "ERROR: Fuera del horario permitido";
        }

        r.setEstado("ASISTIO");
        r.setAsistio(true);
        r.setUsado(true);
        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy("sistema");
        repo.save(r);

        return "Ingreso validado correctamente";
    }

    public ReservaCanchaResponseDTO obtenerReservaPorQR(String token) {
        return repo.findByQrToken(token)
                .map(this::mapearReserva)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
    }

    public void cancelarReserva(Long id, String cedula) {
        actualizarEstados();

        if (id == null) {
            throw new RuntimeException("ID de reserva no proporcionado");
        }

        ReservaCancha reserva = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        // 🔐 VALIDAR QUE SEA DEL USUARIO
        if (!reserva.getUsuario().getCedula().equals(cedula)) {
            throw new RuntimeException("No autorizado para cancelar esta reserva");
        }

        // 🔥 VALIDAR ESTADO
        if (!"RESERVADO".equals(reserva.getEstado())) {
            throw new RuntimeException("Solo se pueden cancelar reservas activas");
        }

        // ✅ CAMBIAR ESTADO (NO BORRAR)
        reserva.setEstado("CANCELADO");
        reserva.setUpdatedAt(LocalDateTime.now());
        reserva.setUpdatedBy(cedula);

        repo.save(reserva);
    }

    @Transactional
    public com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO solicitarDesbloqueo(String cedula) {
        Usuario usuario = usuarioService.obtenerPorCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        if (!Boolean.TRUE.equals(usuario.getCanchaBloqueado())) {
            throw new IllegalStateException("El usuario no está bloqueado para reservar canchas");
        }
        if (desbloqueoRepo.existsByUsuario_CedulaAndEstado(cedula, "PENDIENTE")) {
            throw new IllegalStateException("Ya existe una solicitud de desbloqueo pendiente");
        }
        SolicitudDesbloqueoCancha solicitud = new SolicitudDesbloqueoCancha();
        solicitud.setUsuario(usuario);
        solicitud.setFechaSolicitud(LocalDateTime.now());
        return mapearSolicitud(desbloqueoRepo.save(solicitud));
    }

    public List<com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO> listarSolicitudesDesbloqueo(String estado) {
        return desbloqueoRepo.findByEstadoOrderByFechaSolicitudDescIdDesc(estado).stream()
                .map(this::mapearSolicitud)
                .toList();
    }

    public com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO obtenerUltimaSolicitudDesbloqueo(String cedula) {
        return desbloqueoRepo.findTopByUsuario_CedulaOrderByFechaSolicitudDesc(cedula)
                .map(this::mapearSolicitud)
                .orElse(null);
    }

    @Transactional
    public com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO resolverSolicitudDesbloqueo(
            Long id,
            boolean aprobar,
            String observacion,
            String administrador) {
        SolicitudDesbloqueoCancha solicitud = desbloqueoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitud de desbloqueo no encontrada"));
        if (!"PENDIENTE".equals(solicitud.getEstado())) {
            throw new IllegalStateException("La solicitud ya fue resuelta");
        }
        if (!aprobar && (observacion == null || observacion.isBlank())) {
            throw new IllegalArgumentException("La observación es obligatoria para rechazar la solicitud");
        }
        solicitud.setEstado(aprobar ? "APROBADA" : "RECHAZADA");
        solicitud.setObservacion(observacion);
        solicitud.setFechaResolucion(LocalDateTime.now());
        solicitud.setResueltoPor(administrador);
        if (aprobar) {
            Usuario usuario = solicitud.getUsuario();
            usuario.setCanchaBloqueado(false);
            usuario.setMotivoBloqueoCancha(null);
            usuario.setUpdatedAt(LocalDateTime.now());
            usuario.setUpdatedBy(administrador);
            usuarioService.save(usuario);
        }
        return mapearSolicitud(desbloqueoRepo.save(solicitud));
    }

    private com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO mapearSolicitud(
            SolicitudDesbloqueoCancha solicitud) {
        return new com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO(
                solicitud.getId(),
                solicitud.getUsuario().getCedula(),
                solicitud.getUsuario().getNombres(),
                solicitud.getEstado(),
                solicitud.getObservacion(),
                solicitud.getFechaSolicitud(),
                solicitud.getFechaResolucion(),
                solicitud.getResueltoPor());
    }

    private boolean solapa(LocalTime inicio1, LocalTime fin1, LocalTime inicio2, LocalTime fin2) {
        return inicio1.isBefore(fin2) && fin1.isAfter(inicio2);
    }

    private ReservaCanchaResponseDTO mapearReserva(ReservaCancha reserva) {
        Usuario usuario = reserva.getUsuario();
        return new ReservaCanchaResponseDTO(
                reserva.getId(),
                reserva.getFecha(),
                reserva.getHoraInicio(),
                reserva.getHoraFin(),
                reserva.getQrToken(),
                reserva.getEstado(),
                reserva.isAsistio(),
                reserva.isNoAsistio(),
                usuario == null ? null : new ReservaCanchaResponseDTO.UsuarioCanchaDTO(
                        usuario.getCedula(),
                        usuario.getNombres()));
    }

    private void validarFechaHoraReserva(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        if (fecha == null || horaInicio == null || horaFin == null) {
            throw new IllegalArgumentException("La fecha y las horas son obligatorias");
        }

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (fecha.isBefore(hoy)) {
            throw new RuntimeException("No puede reservar fechas anteriores");
        }

        if (!horaFin.isAfter(horaInicio)) {
            throw new RuntimeException("La hora fin debe ser mayor a la hora inicio");
        }

        if (horaInicio.isBefore(HORA_MIN) || horaFin.isAfter(HORA_MAX)) {
            throw new RuntimeException("Horario permitido de 06:00 a 20:00");
        }

        if (fecha.isEqual(hoy) && !horaInicio.isAfter(ahora)) {
            throw new RuntimeException("No puede reservar en horarios pasados");
        }
    }

}