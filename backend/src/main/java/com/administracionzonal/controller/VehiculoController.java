package com.administracionzonal.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.VehiculoRepository;
import com.administracionzonal.service.VehiculoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoRepository vehiculoRepository;
    private final VehiculoService vehiculoService;

    @GetMapping
    public List<Vehiculo> listarVehiculos() {
        return vehiculoRepository.findAll();
    }

    @GetMapping("/choferes")
    public ResponseEntity<?> obtenerChoferes() {
        return ResponseEntity.ok(vehiculoService.listarChoferes());
    }
}