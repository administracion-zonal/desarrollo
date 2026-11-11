package com.administracionzonal.service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Sort;

import com.administracionzonal.dto.VehiculoCatalogoDTO;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.ReservaVehiculoRepository;
import com.administracionzonal.repository.VehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;
    private final ReservaVehiculoRepository reservaVehiculoRepository;

    public List<VehiculoCatalogoDTO> listarVehiculos() {
        return vehiculoRepository.findAll(Sort.by(Sort.Order.desc("idVehiculo"))).stream()
                .map(v -> VehiculoCatalogoDTO.builder()
                        .idVehiculo(v.getIdVehiculo())
                        .marca(v.getMarca())
                        .modelo(v.getModelo())
                        .placa(v.getPlaca())
                        .estado(v.getEstado())
                        .build())
                .toList();
    }

    @Transactional
    public VehiculoCatalogoDTO actualizarEstado(Long idVehiculo, String estado) {
        String estadoNormalizado = estado == null ? "" : estado.trim().toUpperCase(Locale.ROOT);
        if (!List.of("DISPONIBLE", "MANTENIMIENTO", "FUERA_DE_SERVICIO", "BLOQUEADO")
                .contains(estadoNormalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de vehículo no permitido");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(idVehiculo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));
        boolean tieneViajesActivos = reservaVehiculoRepository
                .existsByVehiculo_IdVehiculoAndFechaReservaGreaterThanEqualAndEstadoIn(
                        idVehiculo, LocalDate.now(), List.of("APROBADA", "EN_USO"));
        if (tieneViajesActivos) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "No se puede cambiar el estado mientras existan viajes activos");
        }

        vehiculo.setEstado(estadoNormalizado);
        Vehiculo guardado = vehiculoRepository.save(vehiculo);
        return VehiculoCatalogoDTO.builder()
                .idVehiculo(guardado.getIdVehiculo())
                .marca(guardado.getMarca())
                .modelo(guardado.getModelo())
                .placa(guardado.getPlaca())
                .estado(guardado.getEstado())
                .build();
    }

    public List<Map<String, Object>> listarChoferes() {

        return vehiculoRepository.findChoferes(Sort.by(
                        Sort.Order.desc("createdAt").nullsLast(),
                        Sort.Order.desc("idUsuario")))
                .stream()
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("idUsuario", u.getIdUsuario());
                    map.put("nombres", u.getNombres());
                    return map;
                })
                .toList();
    }
}