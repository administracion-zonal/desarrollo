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

import com.administracionzonal.dto.BloqueHorarioDTO;
import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.dto.ReservaAdminDTO;
import com.administracionzonal.dto.ReservaDTO;
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
    private static final LocalTime HORA_MAX = LocalTime.of(16, 0);

    /*
     * ======================================================
     * CREAR RESERVA
     * ======================================================
     */
    public ReservaCoworking crearReservaPublica(ReservaDTO dto) {

        validarFechaHoraReserva(dto.getFecha(), dto.getHoraInicio(), dto.getHoraFin());

        Usuario usuario = usuarioService.obtenerOcrearUsuario(
                dto.getCedula(),
                dto.getNombres(),
                dto.getNombreInstitucion(),
                dto.getCorreo()

        );

        if (dto.getTipoUsuario() != null && !dto.getTipoUsuario().isEmpty()) {
            usuario.setTipoUsuario(dto.getTipoUsuario());
            usuarioService.save(usuario);
        }

        LocalDate inicioMes = dto.getFecha().withDayOfMonth(1);
        LocalDate finMes = dto.getFecha().withDayOfMonth(dto.getFecha().lengthOfMonth());

        List<ReservaCoworking> reservasMes = reservaRepo.findByUsuario_CedulaAndFechaBetween(
                usuario.getCedula(),
                inicioMes,
                finMes);

        if (reservasMes.size() >= 5) {
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
        r.setQrToken(UUID.randomUUID().toString());
        r.setUsado(false);
        r.setCreatedAt(LocalDateTime.now());
        r.setUpdatedAt(LocalDateTime.now());
        r.setCreatedBy(usuario.getCedula());
        r.setUpdatedBy(usuario.getCedula());

        return reservaRepo.save(r);
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
                    ocupados++;
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
                    ocupados++;
                }
            }

            if (ocupados >= capacidad) {
                throw new RuntimeException(
                        "No hay cupos disponibles entre " + t);
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
            case "COMPARTIDO_A" -> 8;
            case "COMPARTIDO_B" -> 12;
            default -> 0;
        };
    }

    public boolean validarQR(String token) {

        Optional<ReservaCoworking> reservaOpt = reservaRepo.findByQrToken(token);

        if (reservaOpt.isEmpty()) {
            return false;
        }

        ReservaCoworking reserva = reservaOpt.get();

        if (reserva.isUsado()) {
            return false;
        }

        reserva.setUsado(true);
        reserva.setUpdatedAt(LocalDateTime.now());
        reserva.setUpdatedBy("sistema");
        reservaRepo.save(reserva);

        return true;
    }

    public List<ReservaCoworking> listarReservas() {
        return reservaRepo.findAll();
    }

    public void marcarAsistencia(Long id) {
        if (id == null) {
            throw new RuntimeException("ID de reserva no proporcionado");
        }
        ReservaCoworking r = reservaRepo.findById(id)
                .orElseThrow();

        LocalTime ahora = LocalTime.now();

        if (ahora.isAfter(r.getHoraInicio().plusMinutes(10))) {
            r.setNoAsistio(true);
            reservaRepo.save(r);
            throw new RuntimeException("Llegó tarde, reserva perdida");
        }

        r.setAsistio(true);
        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy("sistema");
        reservaRepo.save(r);
    }

    public List<ReservaAdminDTO> listarReservasAdmin() {

        return reservaRepo.findAll().stream().map(r -> {

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

            dto.setAsistio(r.isAsistio());
            dto.setNoAsistio(r.isNoAsistio());
            dto.setQrToken(r.getQrToken());
            dto.setUsado(r.isUsado());

            return dto;
        }).toList();
    }

    public List<ReservaUsuarioDTO> listarReservasUsuario(String cedula) {

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        return reservaRepo.findByUsuario_CedulaOrderByFechaDesc(cedula)
                .stream()
                .map(r -> {

                    ReservaUsuarioDTO dto = new ReservaUsuarioDTO();

                    dto.setId(r.getId());
                    dto.setFecha(r.getFecha().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());
                    dto.setNombreArea(r.getNombreArea());
                    dto.setNombreInstitucion(r.getNombreInstitucion());

                    // 🔎 vigente
                    boolean vigente = r.getFecha().isAfter(hoy) ||
                            (r.getFecha().isEqual(hoy) && ahora.isBefore(r.getHoraFin()));

                    dto.setVigente(vigente);

                    // ❌ cancelable (30 min antes)
                    boolean puedeCancelar = r.getFecha().isAfter(hoy) ||
                            (r.getFecha().isEqual(hoy) &&
                                    Duration.between(ahora, r.getHoraInicio()).toMinutes() >= 30);

                    dto.setPuedeCancelar(puedeCancelar);

                    // 🔳 QR solo si está vigente
                    if (vigente) {
                        dto.setQrToken(r.getQrToken());
                    }

                    return dto;
                })
                .toList();
    }

    public void cancelarReserva(Long id, String cedula) {
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

        boolean permitido = r.getFecha().isAfter(hoy) ||
                (r.getFecha().isEqual(hoy) &&
                        Duration.between(ahora, r.getHoraInicio()).toMinutes() >= 30);

        if (!permitido) {
            throw new RuntimeException(
                    "No se puede cancelar con menos de 30 minutos");
        }

        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy(cedula);
        reservaRepo.save(r);
        reservaRepo.delete(r);
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

        if (horaInicio.isBefore(HORA_MIN) || horaFin.isAfter(HORA_MAX)) {
            throw new RuntimeException("Horario permitido de 08:00 a 16:00");
        }

        if (fecha.isEqual(hoy) && !horaInicio.isAfter(ahora)) {
            throw new RuntimeException("No puede reservar en horarios pasados");
        }
    }

}
