package com.administracionzonal.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.MisReservasVehiculoDTO;
import com.administracionzonal.dto.RegistrarRetornoVehiculoRequest;
import com.administracionzonal.dto.RegistrarSalidaVehiculoRequest;
import com.administracionzonal.dto.ReservaVehiculoResponseDTO;
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

    @GetMapping("/mis")
    public List<MisReservasVehiculoDTO> misReservas(Authentication auth) {

        String cedula = auth.getName();

        Long idUsuario = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getIdUsuario();

        return service.misReservas(idUsuario);
    }

    @GetMapping("/chofer")
    public List<MisReservasVehiculoDTO> reservasChofer(Authentication auth) {

        String cedula = auth.getName();

        Long idChofer = usuarioRepository.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"))
                .getIdUsuario();

        return service.reservasChofer(idChofer);
    }

    @PostMapping("/chofer/{idReserva}/salida")
    public ReservaVehiculoResponseDTO registrarSalida(
            @PathVariable Long idReserva,
            @Valid @RequestBody RegistrarSalidaVehiculoRequest request,
            Authentication auth) {
        return service.registrarSalida(idReserva, auth.getName(), request);
    }

    @PostMapping("/chofer/{idReserva}/retorno")
    public ReservaVehiculoResponseDTO registrarRetorno(
            @PathVariable Long idReserva,
            @Valid @RequestBody RegistrarRetornoVehiculoRequest request,
            Authentication auth) {
        return service.registrarRetorno(idReserva, auth.getName(), request);
    }

    @GetMapping("/admin/todas")
    public List<MisReservasVehiculoDTO> todas() {
        return service.obtenerTodas();
    }

    @GetMapping("/disponibilidad")
    public Map<String, Object> disponibilidad(
            @RequestParam Long idVehiculo,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {

        List<String> horas = service.obtenerHorasOcupadas(idVehiculo, fecha);

        return Map.of("horas", horas);
    }
}