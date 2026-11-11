package com.administracionzonal.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.ReservaCanchaDTO;
import com.administracionzonal.dto.ReservaCanchaResponseDTO;
import com.administracionzonal.dto.ReservaCanchaUsuarioDTO;
import com.administracionzonal.dto.ResolverSolicitudDesbloqueoRequest;
import com.administracionzonal.dto.SolicitudDesbloqueoCanchaDTO;
import com.administracionzonal.entity.ReservaCancha;
import com.administracionzonal.service.ReservaCanchaService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cancha")
@RequiredArgsConstructor
public class ReservaCanchaController {

    private final ReservaCanchaService service;

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody ReservaCanchaDTO dto, Authentication auth) {
        try {
            dto.setCedula(auth.getName());
            return ResponseEntity.ok(service.crearReserva(dto));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/todas")
    public ResponseEntity<List<ReservaCanchaResponseDTO>> listar() {
        return ResponseEntity.ok(service.listarTodas());
    }

    @GetMapping("/disponibilidad")
    public ResponseEntity<?> disponibilidad(
            @RequestParam String fecha,
            Authentication auth) {

        return ResponseEntity.ok(service.obtenerDisponibilidad(
                LocalDate.parse(fecha),
                auth.getName()));
    }

    @PostMapping("/validar")
    public ResponseEntity<?> validarQR(@RequestParam String token) {
        String resultado = service.validarQR(token);
        return resultado.startsWith("ERROR:")
                ? ResponseEntity.status(409).body(resultado)
                : ResponseEntity.ok(service.obtenerReservaPorQR(token));
    }

    @GetMapping("/mis")
    public List<ReservaCanchaUsuarioDTO> misReservas(Authentication auth) {
        String cedula = auth.getName();
        return service.listarReservasUsuario(cedula);
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id, Authentication auth) {
        String cedula = auth.getName();
        service.cancelarReserva(id, cedula);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/desbloqueo")
    public ResponseEntity<SolicitudDesbloqueoCanchaDTO> solicitarDesbloqueo(Authentication auth) {
        return ResponseEntity.ok(service.solicitarDesbloqueo(auth.getName()));
    }

    @GetMapping("/desbloqueo/mis")
    public ResponseEntity<SolicitudDesbloqueoCanchaDTO> miSolicitudDesbloqueo(Authentication auth) {
        return ResponseEntity.ok(service.obtenerUltimaSolicitudDesbloqueo(auth.getName()));
    }

    @GetMapping("/desbloqueo/pendientes")
    public ResponseEntity<List<SolicitudDesbloqueoCanchaDTO>> solicitudesDesbloqueoPendientes() {
        return ResponseEntity.ok(service.listarSolicitudesDesbloqueo("PENDIENTE"));
    }

    @PostMapping("/desbloqueo/{id}/resolver")
    public ResponseEntity<SolicitudDesbloqueoCanchaDTO> resolverDesbloqueo(
            @PathVariable Long id,
            @RequestBody ResolverSolicitudDesbloqueoRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.resolverSolicitudDesbloqueo(
                id,
                request.aprobar(),
                request.observacion(),
                auth.getName()));
    }

}