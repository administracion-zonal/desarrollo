package com.administracionzonal.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.AsignarChoferDTO;
import com.administracionzonal.dto.ReservaVehiculoDTO;
import com.administracionzonal.dto.ReservaVehiculoResponseDTO;
import com.administracionzonal.entity.ReservaVehiculo;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.service.ReservaVehiculoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class ReservaVehiculoController {

    private final ReservaVehiculoService service;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/reservar")
    public ReservaVehiculoResponseDTO reservar(
            @Valid @RequestBody ReservaVehiculoDTO dto,
            Authentication auth) {

        String cedula = auth.getName();

        // ⚠️ AQUÍ DEBES MAPEAR CÉDULA → ID USUARIO
        Long idUsuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getIdUsuario();

        return service.crearReserva(idUsuario, dto);
    }

    @GetMapping("/mis")
    public List<ReservaVehiculo> misReservas(Authentication auth) {

        String cedula = auth.getName();

        Long idUsuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getIdUsuario();

        return service.misReservas(idUsuario);
    }

    @GetMapping("/chofer")
    public List<ReservaVehiculo> reservasChofer(Authentication auth) {

        String cedula = auth.getName();

        Long idChofer = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getIdUsuario();

        return service.reservasChofer(idChofer);
    }

    @GetMapping("/admin/todas")
    public List<ReservaVehiculo> todas() {
        return service.obtenerTodas();
    }

    @PutMapping("/admin/aprobar/{id}")
    public ReservaVehiculoResponseDTO aprobar(@PathVariable @NonNull Long id) {
        return service.aprobarReserva(id);
    }

    @PutMapping("/admin/rechazar/{id}")
    public ReservaVehiculoResponseDTO rechazar(@PathVariable @NonNull Long id) {
        return service.rechazarReserva(id);
    }

    @PutMapping("/admin/asignar-chofer")
    public ReservaVehiculoResponseDTO asignarChofer(
            @RequestBody @Valid AsignarChoferDTO dto) {

        Long idReserva = dto.getIdReserva();
        Long idChofer = dto.getIdChofer();

        if (idReserva == null || idChofer == null) {
            throw new RuntimeException("Datos incompletos");
        }

        return service.asignarChofer(idReserva, idChofer);
    }

    @GetMapping("/disponibilidad")
    public Map<String, Object> disponibilidad(
            @RequestParam Long idVehiculo,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<String> horas = service.obtenerHorasOcupadas(idVehiculo, fecha);

        return Map.of("horas", horas);
    }
}