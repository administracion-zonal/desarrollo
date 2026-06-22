package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.administracionzonal.dto.MisReservasVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoResponseDTO;
import com.administracionzonal.dto.ViajeVehiculoDTO;
import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.repository.VehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservaVehiculoService {

    private static final LocalTime HORA_MINIMA = LocalTime.of(0, 1);
    private static final LocalTime HORA_MAXIMA = LocalTime.of(11, 59);

    private final ReservaVehiculoRepository repository;

    private final UsuarioRepository usuarioRepo;

    private final VehiculoRepository vehiculoRepo;

    @Transactional
    public ReservaVehiculoResponseDTO crearReserva(Long idUsuario, ReservaVehiculoDTO dto) {

        // 🔥 VALIDACIONES
        if (dto.getHoraFin().isBefore(dto.getHoraInicio())) {
            throw new RuntimeException("La hora fin no puede ser menor a la hora inicio");
        }

        if (dto.getHoraInicio().isBefore(HORA_MINIMA) || dto.getHoraFin().isAfter(HORA_MAXIMA)) {
            throw new RuntimeException("El horario permitido es desde 00:01 hasta 11:59");
        }

        if (dto.getFechaReserva().isEqual(LocalDate.now())
                && dto.getHoraInicio().isBefore(LocalDateTime.now().toLocalTime())) {
            throw new RuntimeException("No se puede reservar en horas pasadas para el día actual");
        }

        if (idUsuario == null) {
            throw new RuntimeException("El idUsuario no puede ser null");
        }

        if (dto.getIdVehiculo() == null) {
            throw new RuntimeException("El idVehiculo no puede ser null");
        }

        List<ReservaVehiculo> conflictos = repository.validarDisponibilidad(
                dto.getIdVehiculo(),
                dto.getFechaReserva(),
                dto.getHoraInicio(),
                dto.getHoraFin());

        if (!conflictos.isEmpty()) {
            throw new RuntimeException("Vehículo no disponible en ese horario");
        }

        Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Long idVehiculo = Objects.requireNonNull(dto.getIdVehiculo(), "El vehículo es obligatorio");
        Vehiculo vehiculo = vehiculoRepo.findById(idVehiculo)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        ReservaVehiculo reserva = ReservaVehiculo.builder()
                .usuario(usuario)
                .vehiculo(vehiculo)
                .chofer(usuario)
                .fechaReserva(dto.getFechaReserva())
                .horaInicio(dto.getHoraInicio())
                .horaFin(dto.getHoraFin())
                .destino(dto.getDestino())
                .observaciones(dto.getObservaciones())
                .estado("APROBADA")
                .estadoViaje("PENDIENTE")
                .noSePresento(false)
                .build();

        @SuppressWarnings("null")
        ReservaVehiculo guardado = repository.save(reserva);

        return mapToDTO(guardado);
    }

    public List<MisReservasVehiculoDTO> misReservas(Long idUsuario) {
        return repository.findByUsuarioIdUsuarioAndEstado(idUsuario, "APROBADA")
                .stream()
                .map(r -> {
                    MisReservasVehiculoDTO dto = new MisReservasVehiculoDTO();

                    dto.setIdReserva(r.getIdReserva());
                    dto.setIdSolicitud(r.getSolicitud() != null ? r.getSolicitud().getId() : null);
                    dto.setFechaReserva(r.getFechaReserva().toString());
                    dto.setHoraInicio(r.getHoraInicio().toString());
                    dto.setHoraFin(r.getHoraFin().toString());

                    dto.setDestino(r.getDestino());
                    dto.setObservaciones(r.getObservaciones());
                    dto.setEstado(r.getEstado());

                    // 👨‍✈️ chofer
                    dto.setNombreChofer(
                            r.getChofer() != null
                                    ? r.getChofer().getNombres()
                                    : "Sin asignar");

                    // 🚗 vehículo
                    if (r.getVehiculo() != null) {
                        dto.setMarcaVehiculo(r.getVehiculo().getMarca());
                        dto.setModeloVehiculo(r.getVehiculo().getModelo());
                        dto.setPlacaVehiculo(r.getVehiculo().getPlaca());
                    }

                    return dto;
                })
                .toList();
    }

    public List<ReservaVehiculo> reservasChofer(Long idChofer) {
        return repository.findByChoferIdUsuario(idChofer);
    }

    public List<ViajeVehiculoDTO> viajesChoferDetalle(Long idChofer) {
        return repository.findByChoferIdUsuario(idChofer)
                .stream()
                .map(this::toViajeVehiculoDTO)
                .toList();
    }

    @Transactional
    public ReservaVehiculo iniciarViajeChofer(Long idReserva, Long idChofer) {
        ReservaVehiculo reserva = repository.findByIdReservaAndChoferIdUsuario(idReserva, idChofer)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada para el chofer autenticado"));

        if (!"APROBADA".equalsIgnoreCase(reserva.getEstado())) {
            throw new RuntimeException("Solo se puede iniciar una reserva aprobada");
        }

        String estadoViajeActual = reserva.getEstadoViaje();
        if (estadoViajeActual != null && !"PENDIENTE".equalsIgnoreCase(estadoViajeActual)) {
            throw new RuntimeException("El viaje ya fue procesado y no puede iniciarse nuevamente");
        }

        // Mantener estado de reserva dentro del check DB y usar estadoViaje para el
        // flujo operativo.
        reserva.setEstadoViaje("INICIADO");

        return repository.save(reserva);
    }

    @Transactional
    public ReservaVehiculo marcarNoPresentado(Long idReserva, Long idChofer, String comentario) {
        if (comentario == null || comentario.trim().isEmpty()) {
            throw new RuntimeException("El comentario es obligatorio");
        }

        ReservaVehiculo reserva = repository.findByIdReservaAndChoferIdUsuario(idReserva, idChofer)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada para el chofer autenticado"));

        if (!"APROBADA".equalsIgnoreCase(reserva.getEstado())) {
            throw new RuntimeException("Solo se puede marcar no presentado en reservas aprobadas");
        }

        String estadoViajeActual = reserva.getEstadoViaje();
        if (estadoViajeActual != null && !"PENDIENTE".equalsIgnoreCase(estadoViajeActual)) {
            throw new RuntimeException("El viaje ya fue procesado y no puede marcarse nuevamente");
        }

        reserva.setEstadoViaje("NO_PRESENTO");
        reserva.setNoSePresento(true);
        reserva.setComentarioNoPresentacion(comentario.trim());

        return repository.save(reserva);
    }

    public List<ReservaVehiculo> reservasAprobadasAdmin() {
        return repository.findByEstadoInOrderByFechaReservaDescHoraInicioDesc(
                Set.of("APROBADA"));
    }

    public List<ViajeVehiculoDTO> reservasAprobadasAdminDetalle() {
        return repository.findByEstadoInOrderByFechaReservaDescHoraInicioDesc(Set.of("APROBADA"))
                .stream()
                .map(this::toViajeVehiculoDTO)
                .toList();
    }

    private ReservaVehiculoResponseDTO mapToDTO(ReservaVehiculo r) {
        return ReservaVehiculoResponseDTO.builder()
                .idReserva(r.getIdReserva())
                .usuario(r.getUsuario())
                .idVehiculo(r.getVehiculo().getIdVehiculo())
                .idChofer(r.getChofer() != null ? r.getChofer().getIdUsuario() : null)
                .fechaReserva(r.getFechaReserva())
                .horaInicio(r.getHoraInicio())
                .horaFin(r.getHoraFin())
                .destino(r.getDestino())
                .estado(r.getEstado())
                .build();
    }

    public List<ReservaVehiculo> obtenerTodas() {
        return repository.findAll();
    }

    // 🔥 APROBAR RESERVA
    @Transactional
    public ReservaVehiculoResponseDTO aprobarReserva(@NonNull Long idReserva) {

        Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");

        ReservaVehiculo reserva = repository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!"PENDIENTE".equals(reserva.getEstado())) {
            throw new RuntimeException("Solo se pueden aprobar reservas pendientes");
        }

        reserva.setEstado("APROBADA");

        return mapToDTO(repository.save(reserva));
    }

    // 🔥 RECHAZAR RESERVA
    @Transactional
    public ReservaVehiculoResponseDTO rechazarReserva(@NonNull Long idReserva) {

        Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");

        ReservaVehiculo reserva = repository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!"PENDIENTE".equals(reserva.getEstado())) {
            throw new RuntimeException("Solo se pueden rechazar reservas pendientes");
        }

        reserva.setEstado("RECHAZADO");

        return mapToDTO(repository.save(reserva));
    }

    // 🔥 ASIGNAR CHOFER

    public ReservaVehiculoResponseDTO asignarChofer(@NonNull Long idReserva, @NonNull Long idChofer) {

        Long reservaId = Objects.requireNonNull(idReserva, "Id reserva obligatorio");
        Long choferId = Objects.requireNonNull(idChofer, "Id chofer obligatorio");

        ReservaVehiculo reserva = repository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        Usuario chofer = usuarioRepo.findById(choferId)
                .orElseThrow(() -> new RuntimeException("Chofer no encontrado"));

        reserva.setChofer(chofer);

        return mapToDTO(repository.save(reserva));
    }

    public List<String> obtenerHorasOcupadas(Long idVehiculo, LocalDate fecha) {

        List<ReservaVehiculo> reservas = repository.findByVehiculo_IdVehiculoAndFechaReserva(idVehiculo, fecha);

        List<String> ocupadas = new ArrayList<>();

        for (ReservaVehiculo r : reservas) {
            int inicio = toMinutes(r.getHoraInicio());
            int fin = toMinutes(r.getHoraFin());

            for (int t = inicio; t < fin; t += 30) {
                ocupadas.add(String.format("%02d:%02d", t / 60, t % 60));
            }
        }

        return ocupadas;
    }

    private int toMinutes(LocalTime hora) {
        return hora.getHour() * 60 + hora.getMinute();
    }

    private ViajeVehiculoDTO toViajeVehiculoDTO(ReservaVehiculo r) {
        String nombreSolicitante = r.getUsuario() != null ? r.getUsuario().getNombres() : null;
        String cedulaSolicitante = r.getUsuario() != null ? r.getUsuario().getCedula() : null;
        String nombreChofer = r.getChofer() != null ? r.getChofer().getNombres() : null;
        String cedulaChofer = r.getChofer() != null ? r.getChofer().getCedula() : null;
        String marcaVehiculo = r.getVehiculo() != null ? r.getVehiculo().getMarca() : null;
        String modeloVehiculo = r.getVehiculo() != null ? r.getVehiculo().getModelo() : null;
        String placaVehiculo = r.getVehiculo() != null ? r.getVehiculo().getPlaca() : null;

        return new ViajeVehiculoDTO(
                r.getIdReserva(),
                r.getFechaReserva() != null ? r.getFechaReserva().toString() : null,
                r.getHoraInicio() != null ? r.getHoraInicio().toString() : null,
                r.getHoraFin() != null ? r.getHoraFin().toString() : null,
                r.getDestino(),
                r.getObservaciones(),
                r.getEstado(),
                r.getEstadoViaje(),
                r.getNoSePresento(),
                r.getComentarioNoPresentacion(),
                nombreSolicitante,
                cedulaSolicitante,
                nombreChofer,
                cedulaChofer,
                marcaVehiculo,
                modeloVehiculo,
                placaVehiculo);
    }
}
