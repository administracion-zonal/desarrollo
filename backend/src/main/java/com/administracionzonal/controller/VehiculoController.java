package com.administracionzonal.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.ActualizarEstadoVehiculoRequest;
import com.administracionzonal.dto.VehiculoCatalogoDTO;
import com.administracionzonal.service.VehiculoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoService vehiculoService;

    @GetMapping
    public List<VehiculoCatalogoDTO> listarVehiculos() {
        return vehiculoService.listarVehiculos();
    }

    @GetMapping("/choferes")
    public ResponseEntity<?> obtenerChoferes() {
        return ResponseEntity.ok(vehiculoService.listarChoferes());
    }

    @PutMapping("/admin/{idVehiculo}/estado")
    public VehiculoCatalogoDTO actualizarEstado(
            @PathVariable Long idVehiculo,
            @Valid @RequestBody ActualizarEstadoVehiculoRequest request) {
        return vehiculoService.actualizarEstado(idVehiculo, request.getEstado());
    }
}