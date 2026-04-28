package com.administracionzonal.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.administracionzonal.repository.VehiculoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VehiculoService {

    private final VehiculoRepository vehiculoRepository;

    public List<Map<String, Object>> listarChoferes() {

        return vehiculoRepository.findChoferes()
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