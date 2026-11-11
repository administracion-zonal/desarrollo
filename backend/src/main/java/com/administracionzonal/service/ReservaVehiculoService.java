package com.administracionzonal.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.administracionzonal.dto.RegistrarRetornoVehiculoRequest;
import com.administracionzonal.dto.RegistrarSalidaVehiculoRequest;
import com.administracionzonal.dto.MisReservasVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoResponseDTO;
import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservaVehiculoService {

    private final ReservaVehiculoRepository repository;

    public List<MisReservasVehiculoDTO> misReservas(Long idUsuario) {
        return repository.findByUsuarioIdUsuarioOrderByIdReservaDesc(idUsuario)
                .stream()
                .map(this::mapToMisReservasDTO)
                .toList();
    }

    public List<MisReservasVehiculoDTO> reservasChofer(Long idChofer) {
        return repository.findByChoferIdUsuarioOrderByIdReservaDesc(idChofer)
                .stream()
                .map(this::mapToMisReservasDTO)
                .toList();
    }

    @Transactional
    public ReservaVehiculoResponseDTO registrarSalida(
            Long idReserva, String cedulaChofer, RegistrarSalidaVehiculoRequest request) {
        marcarInasistenciasVencidas();
        ReservaVehiculo reserva = obtenerReservaChofer(idReserva, cedulaChofer);
        if (!"APROBADA".equals(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El viaje no está aprobado o ya inició");
        }
        if (!estaDisponibleParaSalida(reserva.getVehiculo().getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El vehículo no está disponible para salida");
        }
        if (request.getKilometrajeInicial() == null || request.getKilometrajeInicial() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El kilometraje inicial no es válido");
        }

        reserva.setKilometrajeInicial(request.getKilometrajeInicial());
        reserva.setSalidaReal(LocalDateTime.now());
        reserva.setEstado("EN_USO");
        reserva.getVehiculo().setEstado("EN_USO");
        return mapToDTO(repository.save(reserva));
    }

    @Transactional
    public ReservaVehiculoResponseDTO registrarRetorno(
            Long idReserva, String cedulaChofer, RegistrarRetornoVehiculoRequest request) {
        ReservaVehiculo reserva = obtenerReservaChofer(idReserva, cedulaChofer);
        if (!"EN_USO".equals(reserva.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se puede registrar el retorno de un viaje iniciado");
        }
        if (request.getKilometrajeFinal() == null
                || reserva.getKilometrajeInicial() == null
                || request.getKilometrajeFinal() < reserva.getKilometrajeInicial()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "El kilometraje final debe ser mayor o igual al inicial");
        }

        reserva.setKilometrajeFinal(request.getKilometrajeFinal());
        reserva.setRetornoReal(LocalDateTime.now());
        reserva.setNovedades(request.getNovedades());
        reserva.setEstado("FINALIZADA");
        Vehiculo vehiculo = reserva.getVehiculo();
        boolean tieneReservasPendientes = repository
                .existsByVehiculo_IdVehiculoAndFechaReservaGreaterThanEqualAndEstadoIn(
                        vehiculo.getIdVehiculo(),
                        LocalDate.now(),
                        List.of("APROBADA", "RESERVADO", "EN_USO"));
        vehiculo.setEstado(tieneReservasPendientes ? "RESERVADO" : "DISPONIBLE");
        return mapToDTO(repository.save(reserva));
    }

    private ReservaVehiculoResponseDTO mapToDTO(ReservaVehiculo r) {
        return ReservaVehiculoResponseDTO.builder()
                .idReserva(r.getIdReserva())
                .idVehiculo(r.getVehiculo().getIdVehiculo())
                .idChofer(r.getChofer() != null ? r.getChofer().getIdUsuario() : null)
                .fechaReserva(r.getFechaReserva())
                .horaInicio(r.getHoraInicio())
                .horaFin(r.getHoraFin())
                .destino(r.getDestino())
                .estado(r.getEstado())
                .observaciones(r.getObservaciones())
                .salidaReal(r.getSalidaReal())
                .retornoReal(r.getRetornoReal())
                .kilometrajeInicial(r.getKilometrajeInicial())
                .kilometrajeFinal(r.getKilometrajeFinal())
                .novedades(r.getNovedades())
                .build();
    }

    private MisReservasVehiculoDTO mapToMisReservasDTO(ReservaVehiculo r) {
        MisReservasVehiculoDTO dto = new MisReservasVehiculoDTO();
        dto.setIdReserva(r.getIdReserva());
        dto.setFechaReserva(r.getFechaReserva().toString());
        dto.setHoraInicio(r.getHoraInicio().toString());
        dto.setHoraFin(r.getHoraFin().toString());
        dto.setDestino(r.getDestino());
        dto.setObservaciones(r.getObservaciones());
        dto.setEstado(r.getEstado());
        dto.setNombreChofer(r.getChofer() != null ? r.getChofer().getNombres() : "Sin asignar");
        dto.setSalidaReal(r.getSalidaReal());
        dto.setRetornoReal(r.getRetornoReal());
        dto.setKilometrajeInicial(r.getKilometrajeInicial());
        dto.setKilometrajeFinal(r.getKilometrajeFinal());
        dto.setNovedades(r.getNovedades());
        if (r.getVehiculo() != null) {
            dto.setMarcaVehiculo(r.getVehiculo().getMarca());
            dto.setModeloVehiculo(r.getVehiculo().getModelo());
            dto.setPlacaVehiculo(r.getVehiculo().getPlaca());
        }
        return dto;
    }

    private ReservaVehiculo obtenerReservaChofer(Long idReserva, String cedulaChofer) {
        ReservaVehiculo reserva = repository.findById(idReserva)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        if (reserva.getChofer() == null || !reserva.getChofer().getCedula().equals(cedulaChofer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La reserva no está asignada a este chofer");
        }
        return reserva;
    }

    private boolean estaDisponibleParaSalida(String estado) {
        return estado == null || List.of("DISPONIBLE", "RESERVADO", "ACTIVO", "OPERATIVO")
                .contains(estado.toUpperCase(Locale.ROOT));
    }

    public List<MisReservasVehiculoDTO> obtenerTodas() {
        return repository.findAll(Sort.by(
                        Sort.Order.desc("idReserva")))
                .stream()
                .map(this::mapToMisReservasDTO)
                .toList();
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void marcarInasistenciasVencidas() {
        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        for (ReservaVehiculo reserva : repository.findByEstadoAndFechaReservaLessThanEqual("APROBADA", hoy)) {
            boolean fechaPasada = reserva.getFechaReserva().isBefore(hoy);
            boolean superoMargenDeLlegada = reserva.getFechaReserva().isEqual(hoy)
                    && ahora.isAfter(reserva.getHoraInicio().plusMinutes(10));

            if (reserva.getSalidaReal() != null || (!fechaPasada && !superoMargenDeLlegada)) {
                continue;
            }

            reserva.setEstado("NO_ASISTIO");
            repository.save(reserva);

            Vehiculo vehiculo = reserva.getVehiculo();
            if (vehiculo != null && "RESERVADO".equals(vehiculo.getEstado())) {
                boolean tieneOtroViajeActivo = repository
                        .existsByVehiculo_IdVehiculoAndFechaReservaGreaterThanEqualAndEstadoIn(
                                vehiculo.getIdVehiculo(), hoy, List.of("APROBADA", "RESERVADO", "EN_USO"));
                if (!tieneOtroViajeActivo) {
                    vehiculo.setEstado("DISPONIBLE");
                }
            }
        }
    }

    public List<String> obtenerHorasOcupadas(Long idVehiculo, LocalDate fecha) {

        List<ReservaVehiculo> reservas = repository.findByVehiculo_IdVehiculoAndFechaReserva(idVehiculo, fecha);

        List<String> ocupadas = new ArrayList<>();

        for (ReservaVehiculo r : reservas) {
            if (!"APROBADA".equals(r.getEstado())
                    && !"RESERVADO".equals(r.getEstado())
                    && !"EN_USO".equals(r.getEstado())) {
                continue;
            }
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
