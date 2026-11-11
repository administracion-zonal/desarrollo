package com.administracionzonal.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import com.administracionzonal.dto.BloqueHorarioDTO;
import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.dto.ReservaAdminDTO;
import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.dto.ReservaCreadaDTO;
import com.administracionzonal.dto.ReservaUsuarioDTO;
import com.administracionzonal.entity.ReservaCoworking;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.ReservaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepo;
    private final UsuarioService usuarioService;

    private static final LocalTime HORA_MIN = LocalTime.of(8, 0);
    private static final LocalTime HORA_MAX = LocalTime.of(16, 30);

    /*
     * ======================================================
     * CREAR RESERVA
     * ======================================================
     */
    @Transactional
    public ReservaCreadaDTO crearReservaPublica(ReservaDTO dto) {

        validarFechaHoraReserva(dto.getFecha(), dto.getHoraInicio(), dto.getHoraFin());

        Usuario usuario = usuarioService.obtenerOcrearUsuario(
                dto.getCedula(),
                dto.getNombres(),
                dto.getNombreInstitucion(),
                dto.getCorreo()

        );

        if (Boolean.TRUE.equals(usuario.getBloqueado())) {
            throw new IllegalStateException("Su cuenta está bloqueada para nuevas reservas. Contacte al administrador.");
        }

        if (dto.getTipoUsuario() != null && !dto.getTipoUsuario().isEmpty()) {
            usuario.setTipoUsuario(dto.getTipoUsuario());
            usuarioService.save(usuario);
        }

        int personas = dto.getNumeroPersonas() == null ? 1 : dto.getNumeroPersonas();
        int maxPersonas = "SALA_REUNIONES".equalsIgnoreCase(dto.getNombreArea()) ? 9 : 4;
        if (personas < 1 || personas > maxPersonas) {
            throw new IllegalArgumentException("La cantidad de personas debe estar entre 1 y " + maxPersonas);
        }

        if (dto.getNombreArea() == null || dto.getNombreArea().isBlank()) {
            throw new IllegalArgumentException("Seleccione un espacio de coworking válido");
        }

        LocalDate inicioMes = dto.getFecha().withDayOfMonth(1);
        LocalDate finMes = dto.getFecha().withDayOfMonth(dto.getFecha().lengthOfMonth());

        if (reservaRepo.contarReservasActivasDelMes(usuario.getCedula(), inicioMes, finMes) >= 5) {
            throw new RuntimeException("Máximo 5 reservas al mes");
        }

        validarCapacidadPorBloques(dto);

        if (!Boolean.TRUE.equals(usuario.getAceptaAcuerdo())) {

            if (!Boolean.TRUE.equals(dto.getAceptaAcuerdo())) {
                throw new RuntimeException("Debe aceptar el acuerdo para continuar");
            }

            usuario.setAceptaAcuerdo(true);
            usuarioService.save(usuario);
        }

        ReservaCoworking r = new ReservaCoworking();
        r.setUsuario(usuario);
        r.setNombreInstitucion(dto.getNombreInstitucion());
        r.setNombreArea(dto.getNombreArea());
        r.setFecha(dto.getFecha());
        r.setHoraInicio(dto.getHoraInicio());
        r.setHoraFin(dto.getHoraFin());
        r.setNumeroPersonas(personas);
        r.setQrToken(UUID.randomUUID().toString());
        r.setEstado("RESERVADO");
        r.setUsado(false);
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        r.setCreatedBy(usuario.getCedula());
        r.setUpdatedBy(usuario.getCedula());

        ReservaCoworking guardada = reservaRepo.save(r);
        return new ReservaCreadaDTO(
                guardada.getId(),
                guardada.getFecha(),
                guardada.getHoraInicio(),
                guardada.getHoraFin(),
                guardada.getNombreArea(),
                guardada.getNumeroPersonas(),
                guardada.getQrToken(),
                guardada.getEstado());
    }

    /*
     * ======================================================
     * DISPONIBILIDAD POR BLOQUES (CORE)
     * ======================================================
     */
    public DisponibilidadDTO obtenerDisponibilidad(String area, LocalDate fecha) {

        int capacidad = capacidadPorArea(area);

        List<ReservaCoworking> reservas = reservaRepo.findByAreaAndFecha(area, fecha);

        List<BloqueHorarioDTO> bloques = new ArrayList<>();

        for (LocalTime t = HORA_MIN; t.isBefore(HORA_MAX); t = t.plusMinutes(30)) {

            int ocupados = 0;

            for (ReservaCoworking r : reservas) {
                if (solapan(
                        r.getHoraInicio(),
                        r.getHoraFin(),
                        t,
                        t.plusMinutes(30))) {
                    ocupados += "SALA_REUNIONES".equalsIgnoreCase(area)
                            ? 1
                            : (r.getNumeroPersonas() == null ? 1 : r.getNumeroPersonas());
                }
            }

            bloques.add(
                    new BloqueHorarioDTO(
                            t.toString(),
                            ocupados,
                            capacidad));
        }

        return new DisponibilidadDTO(area, bloques);
    }

    /*
     * ======================================================
     * VALIDACIÓN REAL DE CAPACIDAD (BACKEND MANDA)
     * ======================================================
     */
    private void validarCapacidadPorBloques(ReservaDTO dto) {

        int capacidad = capacidadPorArea(dto.getNombreArea());

        List<ReservaCoworking> reservas = reservaRepo.findByAreaAndFecha(
                dto.getNombreArea(),
                dto.getFecha());

        for (LocalTime t = dto.getHoraInicio(); t.isBefore(dto.getHoraFin()); t = t.plusMinutes(30)) {

            int ocupados = 0;

            for (ReservaCoworking r : reservas) {
                if (solapan(
                        r.getHoraInicio(),
                        r.getHoraFin(),
                        t,
                        t.plusMinutes(30))) {
                    ocupados += "SALA_REUNIONES".equalsIgnoreCase(dto.getNombreArea())
                            ? 1
                            : (r.getNumeroPersonas() == null ? 1 : r.getNumeroPersonas());
                }
            }

            int solicitados = "SALA_REUNIONES".equalsIgnoreCase(dto.getNombreArea())
                    ? 1
                    : (dto.getNumeroPersonas() == null ? 1 : dto.getNumeroPersonas());
            if (ocupados + solicitados > capacidad) {
                throw new RuntimeException("No hay suficientes cupos disponibles entre " + t);
            }
        }
    }

    /*
     * ======================================================
     * UTILIDADES
     * ======================================================
     */
    private boolean solapan(
            LocalTime inicio1,
            LocalTime fin1,
            LocalTime inicio2,
            LocalTime fin2) {
        return inicio1.isBefore(fin2) && fin1.isAfter(inicio2);
    }

    private int capacidadPorArea(String area) {
        return switch (area.toUpperCase()) {
            case "SALA_REUNIONES" -> 1;
            case "TRABAJO_INDIVIDUAL" -> 4;
            case "COMPARTIDO_A", "COMPARTIDO_B" -> 4;
            default -> throw new IllegalArgumentException("Espacio de coworking no válido");
        };
    }

    public boolean validarQR(String token) {
        actualizarEstadosInasistencia();

        Optional<ReservaCoworking> reservaOpt = reservaRepo.findByQrToken(token);

        if (reservaOpt.isEmpty()) {
            return false;
        }

        ReservaCoworking reserva = reservaOpt.get();

        if (reserva.isUsado() || !"RESERVADO".equals(reserva.getEstado())) {
            return false;
        }

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        if (!reserva.getFecha().isEqual(hoy)
                || ahora.isBefore(reserva.getHoraInicio().minusMinutes(10))
                || ahora.isAfter(reserva.getHoraInicio().plusMinutes(10))) {
            return false;
        }

        reserva.setUsado(true);
        reserva.setAsistio(true);
        reserva.setEstado("ASISTIO");
        reserva.setUpdatedAt(LocalDateTime.now());
        reserva.setUpdatedBy("sistema");
        reservaRepo.save(reserva);

        return true;
    }

    public List<ReservaCoworking> listarReservas() {
        return reservaRepo.findAll(Sort.by(
                Sort.Order.desc("createdAt").nullsLast(),
                Sort.Order.desc("id")));
    }

    public void marcarAsistencia(Long id) {
        if (id == null) {
            throw new RuntimeException("ID de reserva no proporcionado");
        }
        ReservaCoworking r = reservaRepo.findById(id)
                .orElseThrow();

        if ("ASISTIO".equals(r.getEstado())) {
            return;
        }
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (!r.getFecha().isEqual(hoy) || !"RESERVADO".equals(r.getEstado())) {
            throw new IllegalStateException("La reserva no está vigente para registrar asistencia");
        }

        if (ahora.isAfter(r.getHoraInicio().plusMinutes(10))) {
            r.setNoAsistio(true);
            r.setEstado("NO_ASISTIO");
            r.setUpdatedAt(LocalDateTime.now());
            r.setUpdatedBy("sistema");
            reservaRepo.save(r);
            throw new RuntimeException("Llegó tarde, reserva perdida");
        }
        if (ahora.isBefore(r.getHoraInicio().minusMinutes(10))) {
            throw new IllegalStateException("Aún no inicia la ventana de asistencia de la reserva");
        }

        r.setAsistio(true);
        r.setUsado(true);
        r.setEstado("ASISTIO");
        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy("sistema");
        reservaRepo.save(r);
    }

    public List<ReservaAdminDTO> listarReservasAdmin() {
        actualizarEstadosInasistencia();

        return reservaRepo.findAll(Sort.by(
                        Sort.Order.desc("createdAt").nullsLast(),
                        Sort.Order.desc("id")))
                .stream().map(r -> {

            ReservaAdminDTO dto = new ReservaAdminDTO();
            Usuario u = r.getUsuario();

            dto.setId(r.getId());
            dto.setCedula(u.getCedula());
            dto.setNombres(u.getNombres());
            dto.setCorreo(u.getCorreo());

            dto.setFecha(r.getFecha().toString());
            dto.setHoraInicio(r.getHoraInicio().toString());
            dto.setHoraFin(r.getHoraFin().toString());

            dto.setNombreArea(r.getNombreArea());
            dto.setNombreInstitucion(r.getNombreInstitucion());
            dto.setNumeroPersonas(r.getNumeroPersonas());
            dto.setEstado(r.getEstado());

            dto.setAsistio(r.isAsistio());
            dto.setNoAsistio(r.isNoAsistio());
            dto.setQrToken(r.getQrToken());
            dto.setUsado(r.isUsado());

            return dto;
        }).toList();
    }

    public List<ReservaUsuarioDTO> listarReservasUsuario(String cedula) {
        actualizarEstadosInasistencia();

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        return reservaRepo.findByUsuario_Cedula(cedula, Sort.by(
                        Sort.Order.desc("createdAt").nullsLast(),
                        Sort.Order.desc("id")))
                .stream()
                .map(r -> {

                    ReservaUsuarioDTO dto = new ReservaUsuarioDTO();

                    dto.setId(r.getId());
                    dto.setFecha(r.getFecha().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());
                    dto.setNombreArea(r.getNombreArea());
                    dto.setNombreInstitucion(r.getNombreInstitucion());
                    dto.setEstado(r.getEstado());

                    // 🔎 vigente
                    boolean vigente = r.getFecha().isAfter(hoy) ||
                            (r.getFecha().isEqual(hoy) && ahora.isBefore(r.getHoraFin()));

                    dto.setVigente(vigente);

                    // ❌ cancelable (30 min antes)
                    boolean puedeCancelar = "RESERVADO".equals(r.getEstado()) && (r.getFecha().isAfter(hoy) ||
                            (r.getFecha().isEqual(hoy) &&
                                    Duration.between(ahora, r.getHoraInicio()).toMinutes() >= 30));

                    dto.setPuedeCancelar(puedeCancelar);

                    // 🔳 QR solo si está vigente
                    if (vigente && "RESERVADO".equals(r.getEstado())) {
                        dto.setQrToken(r.getQrToken());
                    }

                    return dto;
                })
                .toList();
    }

    public void cancelarReserva(Long id, String cedula) {
        actualizarEstadosInasistencia();
        if (id == null) {
            throw new RuntimeException("ID de reserva no proporcionado");

        }
        ReservaCoworking r = reservaRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!r.getUsuario().getCedula().equals(cedula)) {
            throw new RuntimeException("No autorizado");
        }

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (!"RESERVADO".equals(r.getEstado())) {
            throw new IllegalStateException("Solo se pueden cancelar reservas vigentes");
        }

        boolean permitido = r.getFecha().isAfter(hoy) ||
                (r.getFecha().isEqual(hoy) &&
                        Duration.between(ahora, r.getHoraInicio()).toMinutes() >= 30);

        if (!permitido) {
            throw new RuntimeException(
                    "No se puede cancelar con menos de 30 minutos");
        }

        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy(cedula);
        r.setEstado("CANCELADO");
        reservaRepo.save(r);
    }

    @Transactional
    public void actualizarEstadosInasistencia() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        for (ReservaCoworking reserva : reservaRepo.findByFechaLessThanEqualAndNoAsistioFalse(hoy)) {
            boolean fechaPasada = reserva.getFecha().isBefore(hoy);
            boolean superoMargenDeLlegada = reserva.getFecha().isEqual(hoy)
                    && ahora.isAfter(reserva.getHoraInicio().plusMinutes(10));
            if (reserva.isAsistio()
                    || !"RESERVADO".equals(reserva.getEstado())
                    || (!fechaPasada && !superoMargenDeLlegada)) {
                continue;
            }

            reserva.setNoAsistio(true);
            reserva.setEstado("NO_ASISTIO");
            reserva.setUpdatedAt(LocalDateTime.now());
            reserva.setUpdatedBy("sistema");
            reservaRepo.save(reserva);

            Usuario usuario = reserva.getUsuario();
            if (reservaRepo.countByUsuario_CedulaAndNoAsistioTrue(usuario.getCedula()) > 2
                    && !Boolean.TRUE.equals(usuario.getBloqueado())) {
                usuario.setBloqueado(true);
                usuario.setMotivoBloqueo(
                        "Bloqueo automático por más de dos inasistencias en coworking");
                usuario.setUpdatedAt(LocalDateTime.now());
                usuario.setUpdatedBy("sistema");
                usuarioService.save(usuario);
            }
        }
    }

    private void validarFechaHoraReserva(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (fecha.isBefore(hoy)) {
            throw new RuntimeException("No puede reservar fechas anteriores");
        }

        if (!horaFin.isAfter(horaInicio)) {
            throw new RuntimeException("La hora fin debe ser mayor que la hora inicio");
        }

        long minutos = Duration.between(horaInicio, horaFin).toMinutes();
        if (minutos > 120 || minutos % 30 != 0) {
            throw new IllegalArgumentException("La duración debe ser de 30 minutos a 2 horas, en bloques de 30 minutos");
        }

        if (horaInicio.isBefore(HORA_MIN) || horaFin.isAfter(HORA_MAX)) {
            throw new RuntimeException("Horario permitido de 08:00 a 16:30");
        }

        if (fecha.isEqual(hoy) && !horaInicio.isAfter(ahora)) {
            throw new RuntimeException("No puede reservar en horarios pasados");
        }

        if (horaInicio.getMinute() % 30 != 0 || horaFin.getMinute() % 30 != 0) {
            throw new IllegalArgumentException("Seleccione horarios en bloques de 30 minutos");
        }

        if (fecha.getDayOfWeek().getValue() > 5) {
            throw new IllegalArgumentException("Solo se permiten reservas de lunes a viernes");
        }
    }

}
