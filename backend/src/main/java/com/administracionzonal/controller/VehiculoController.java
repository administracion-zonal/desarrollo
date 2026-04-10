package com.administracionzonal.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.administracionzonal.dto.ChoferDTO;
import com.administracionzonal.entity.Vehiculo;
import com.administracionzonal.repository.VehiculoRepository;
import com.administracionzonal.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {

    private final VehiculoRepository vehiculoRepository;
    private final UsuarioService usuarioService;

    @GetMapping
    public List<Vehiculo> listarVehiculos() {
        return vehiculoRepository.findAll();
    }

    @GetMapping("/choferes")
    public List<ChoferDTO> listarChoferes() {
        return usuarioService.obtenerChoferes();
    }

}