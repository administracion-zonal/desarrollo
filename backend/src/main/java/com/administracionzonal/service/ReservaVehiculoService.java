package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.administracionzonal.dto.MisReservasVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoResponseDTO;
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

    private final ReservaVehiculoRepository repository;

    private final UsuarioRepository usuarioRepo;

    private final VehiculoRepository vehiculoRepo;

    @Transactional
    public ReservaVehiculoResponseDTO crearReserva(Long idUsuario, ReservaVehiculoDTO dto) {

        // 🔥 VALIDACIONES
        if (dto.getHoraFin().isBefore(dto.getHoraInicio())) {
            throw new RuntimeException("La hora fin no puede ser menor a la hora inicio");
        }

        if (idUsuario == null) {
            throw new RuntimeException("El idUsuario no puede ser null");
        }

        Long idVehiculo = dto.getIdVehiculo();

        if (idVehiculo == null) {
            throw new RuntimeException("El idVehiculo no puede ser null");
        }

        List<ReservaVehiculo> conflictos = repository.validarDisponibilidad(
                idVehiculo,
                dto.getFechaReserva(),
                dto.getHoraInicio(),
                dto.getHoraFin());

        if (!conflictos.isEmpty()) {
            throw new RuntimeException("Vehículo no disponible en ese horario");
        }

        Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

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

        ReservaVehiculo reserva = repository.findById(idReserva)
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

        ReservaVehiculo reserva = repository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        if (!"PENDIENTE".equals(reserva.getEstado())) {
            throw new RuntimeException("Solo se pueden rechazar reservas pendientes");
        }

        reserva.setEstado("RECHAZADO");

        return mapToDTO(repository.save(reserva));
    }

    // 🔥 ASIGNAR CHOFER

    public ReservaVehiculoResponseDTO asignarChofer(@NonNull Long idReserva, @NonNull Long idChofer) {

        ReservaVehiculo reserva = repository.findById(idReserva)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        Usuario chofer = usuarioRepo.findById(idChofer)
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
}
