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
import org.springframework.stereotype.Service;

import com.administracionzonal.dto.ReservaCanchaDTO;
import com.administracionzonal.dto.ReservaCanchaUsuarioDTO;
import com.administracionzonal.entity.ReservaCancha;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.ReservaCanchaRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservaCanchaService {

    private final ReservaCanchaRepository repo;
    private final UsuarioService usuarioService;

    private static final LocalTime HORA_MIN = LocalTime.of(8, 0);
    private static final LocalTime HORA_MAX = LocalTime.of(16, 0);

    public ReservaCancha crearReserva(ReservaCanchaDTO dto) {

        validarFechaHoraReserva(dto.getFecha(), dto.getHoraInicio(), dto.getHoraFin());

        Usuario usuario = usuarioService.obtenerOcrearUsuario(
                dto.getCedula(),
                dto.getNombres(),
                dto.getNombreInstitucion(),
                dto.getCorreo());

        /* ================= REGLA 1: SOLO 1 POR DÍA ================= */
        List<ReservaCancha> hoy = repo.findByUsuario_CedulaAndFecha(
                usuario.getCedula(),
                dto.getFecha());

        if (!hoy.isEmpty()) {
            throw new RuntimeException("Solo puede reservar una vez al día");
        }

        /* ================= REGLA 2: MÁXIMO 5 AL MES ================= */
        LocalDate inicioMes = dto.getFecha().withDayOfMonth(1);
        LocalDate finMes = dto.getFecha().withDayOfMonth(
                dto.getFecha().lengthOfMonth());

        List<ReservaCancha> mes = repo.findByUsuario_CedulaAndFechaBetween(
                usuario.getCedula(),
                inicioMes,
                finMes);

        if (mes.size() >= 5) {
            throw new RuntimeException("Máximo 5 reservas al mes");
        }

        /* ================= REGLA 3: MÁXIMO 2 HORAS ================= */
        long minutos = Duration
                .between(dto.getHoraInicio(), dto.getHoraFin())
                .toMinutes();

        if (minutos <= 0 || minutos > 120) {
            throw new RuntimeException("Máximo 2 horas por reserva");
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
        return repo.save(r);
    }

    public List<ReservaCancha> listarTodas() {
        return repo.findAll();
    }

    public List<ReservaCanchaUsuarioDTO> listarReservasUsuario(String cedula) {
        return repo.findByUsuario_Cedula(cedula)
                .stream()
                .map(r -> {
                    ReservaCanchaUsuarioDTO dto = new ReservaCanchaUsuarioDTO();

                    dto.setId(r.getId());
                    dto.setFecha(r.getFecha().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());
                    dto.setEstado(r.getEstado());
                    dto.setQrToken(r.getQrToken());

                    return dto;
                })
                .toList();
    }

    public Map<String, Object> obtenerDisponibilidad(LocalDate fecha, String cedula) {

        List<ReservaCancha> reservas = repo.findByFecha(fecha);

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

        if (cedula != null) {
            bloqueado = repo.existsByUsuario_CedulaAndFecha(cedula, fecha);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("horas", horasOcupadas);
        response.put("bloqueado", bloqueado);

        return response;
    }

    public void actualizarEstados() {

        List<ReservaCancha> reservas = repo.findAll();

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
                r.setUpdatedAt(LocalDateTime.now());
                r.setUpdatedBy("sistema");
                repo.save(r);
            }
        }
    }

    @Scheduled(fixedRate = 60000) // Ejecutar cada minuto
    public void tareaEstados() {
        actualizarEstados();
    }

    public String validarQR(String token) {

        ReservaCancha r = repo.findByQrToken(token)
                .orElseThrow(() -> new RuntimeException("QR inválido"));

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
        r.setUpdatedAt(LocalDateTime.now());
        r.setUpdatedBy("sistema");
        repo.save(r);

        return "Ingreso validado correctamente";
    }

    public void cancelarReserva(Long id, String cedula) {

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

    private void validarFechaHoraReserva(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        if (fecha.isBefore(hoy)) {
            throw new RuntimeException("No puede reservar fechas anteriores");
        }

        if (!horaFin.isAfter(horaInicio)) {
            throw new RuntimeException("La hora fin debe ser mayor a la hora inicio");
        }

        if (horaInicio.isBefore(HORA_MIN) || horaFin.isAfter(HORA_MAX)) {
            throw new RuntimeException("Horario permitido de 08:00 a 16:00");
        }

        if (fecha.isEqual(hoy) && !horaInicio.isAfter(ahora)) {
            throw new RuntimeException("No puede reservar en horarios pasados");
        }
    }

}