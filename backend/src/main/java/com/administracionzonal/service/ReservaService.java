package com.administracionzonal.service;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.administracionzonal.dto.BloqueHorarioDTO;
import com.administracionzonal.dto.DisponibilidadDTO;
import com.administracionzonal.dto.ReservaUsuarioDTO;
import com.administracionzonal.dto.ReservaDTO;
import com.administracionzonal.entity.ReservaCoworking;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.ReservaRepository;

import com.administracionzonal.dto.ReservaAdminDTO;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepo;
    private final UsuarioService usuarioService;

    private static final LocalTime HORA_MIN = LocalTime.of(8, 0);
    private static final LocalTime HORA_MAX = LocalTime.of(16, 0);

    /* ======================================================
       CREAR RESERVA
    ====================================================== */
    public ReservaCoworking crearReservaPublica(ReservaDTO dto) {

        Usuario usuario = usuarioService.obtenerOcrearUsuario(
                dto.getCedula(),
                dto.getNombres(),
                dto.getNombreInstitucion(),
                dto.getTipoUsuario(), 
                dto.getCorreo()
        );

        validarCapacidadPorBloques(dto);

        String tipoUsuarioFinal = usuario.getTipoUsuario();

        if (!Boolean.TRUE.equals(usuario.getAceptaAcuerdo())) {

            if (!Boolean.TRUE.equals(dto.getAceptaAcuerdo())) {
                throw new RuntimeException("Debe aceptar el acuerdo para continuar");
            }

            usuario.setAceptaAcuerdo(true);
            usuarioService.save(usuario);
        }



        ReservaCoworking r = new ReservaCoworking();
        r.setUsuario(usuario);
        r.setTipoUsuario(tipoUsuarioFinal);
        r.setNombreInstitucion(dto.getNombreInstitucion());
        r.setNombreArea(dto.getNombreArea());
        r.setFecha(dto.getFecha());
        r.setHoraInicio(dto.getHoraInicio());
        r.setHoraFin(dto.getHoraFin());
        r.setQrToken(UUID.randomUUID().toString());
        r.setUsado(false);

        return reservaRepo.save(r);
    }

    /* ======================================================
       DISPONIBILIDAD POR BLOQUES (CORE)
    ====================================================== */
    public DisponibilidadDTO obtenerDisponibilidad(String area, LocalDate fecha) {

        int capacidad = capacidadPorArea(area);

        List<ReservaCoworking> reservas =
                reservaRepo.findByAreaAndFecha(area, fecha);

        List<BloqueHorarioDTO> bloques = new ArrayList<>();

        for (LocalTime t = HORA_MIN; t.isBefore(HORA_MAX); t = t.plusMinutes(30)) {

            int ocupados = 0;

            for (ReservaCoworking r : reservas) {
                if (solapan(
                        r.getHoraInicio(),
                        r.getHoraFin(),
                        t,
                        t.plusMinutes(30)
                )) {
                    ocupados++;
                }
            }

            bloques.add(
                    new BloqueHorarioDTO(
                            t.toString(),
                            ocupados,
                            capacidad
                    )
            );
        }

        return new DisponibilidadDTO(area, bloques);
    }

    /* ======================================================
       VALIDACIÓN REAL DE CAPACIDAD (BACKEND MANDA)
    ====================================================== */
    private void validarCapacidadPorBloques(ReservaDTO dto) {

        int capacidad = capacidadPorArea(dto.getNombreArea());

        List<ReservaCoworking> reservas =
                reservaRepo.findByAreaAndFecha(
                        dto.getNombreArea(),
                        dto.getFecha()
                );

        for (LocalTime t = dto.getHoraInicio();
             t.isBefore(dto.getHoraFin());
             t = t.plusMinutes(30)) {

            int ocupados = 0;

            for (ReservaCoworking r : reservas) {
                if (solapan(
                        r.getHoraInicio(),
                        r.getHoraFin(),
                        t,
                        t.plusMinutes(30)
                )) {
                    ocupados++;
                }
            }

            if (ocupados >= capacidad) {
                throw new RuntimeException(
                        "No hay cupos disponibles entre " + t
                );
            }
        }
    }

    /* ======================================================
       UTILIDADES
    ====================================================== */
    private boolean solapan(
            LocalTime inicio1,
            LocalTime fin1,
            LocalTime inicio2,
            LocalTime fin2
    ) {
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

        Optional<ReservaCoworking> reservaOpt =
                reservaRepo.findByQrToken(token);

        if (reservaOpt.isEmpty()) {
            return false;
        }

        ReservaCoworking reserva = reservaOpt.get();

        if (reserva.isUsado()) {
            return false;
        }

        reserva.setUsado(true);
        reservaRepo.save(reserva);

        return true;
    }

    public List<ReservaCoworking> listarReservas() {
        return reservaRepo.findAll();
    }

    public void marcarAsistencia(Long id) {
        ReservaCoworking r = reservaRepo.findById(id)
            .orElseThrow();

        LocalTime ahora = LocalTime.now();

        if (ahora.isAfter(r.getHoraInicio().plusMinutes(10))) {
            r.setNoAsistio(true);
            reservaRepo.save(r);
            throw new RuntimeException("Llegó tarde, reserva perdida");
        }

        r.setAsistio(true);
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
            dto.setTipoUsuario(r.getTipoUsuario());

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
                boolean vigente =
                    r.getFecha().isAfter(hoy) ||
                    (r.getFecha().isEqual(hoy) && ahora.isBefore(r.getHoraFin()));

                dto.setVigente(vigente);

                // ❌ cancelable (30 min antes)
                boolean puedeCancelar =
                    r.getFecha().isAfter(hoy) ||
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

        ReservaCoworking r = reservaRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!r.getUsuario().getCedula().equals(cedula)) {
            throw new RuntimeException("No autorizado");
        }

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        boolean permitido =
            r.getFecha().isAfter(hoy) ||
            (r.getFecha().isEqual(hoy) &&
            Duration.between(ahora, r.getHoraInicio()).toMinutes() >= 30);

        if (!permitido) {
            throw new RuntimeException(
                "No se puede cancelar con menos de 30 minutos"
            );
        }

        reservaRepo.delete(r);
    }

}

   

