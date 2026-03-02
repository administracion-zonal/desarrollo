package com.administracionzonal.controller;

import com.administracionzonal.dto.LoginRequest;
import com.administracionzonal.dto.RegisterRequest;
import com.administracionzonal.dto.AuthResponseDTO;
import com.administracionzonal.dto.CambioPasswordDTO;
import com.administracionzonal.service.UsuarioService;
import com.administracionzonal.service.AuthService;
import org.springframework.security.core.Authentication;
import lombok.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponseDTO response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(
            @RequestBody CambioPasswordDTO dto,
            Principal principal
    ) {

         try {

        String cedula = principal.getName();

        usuarioService.cambiarPassword(dto, cedula);

        return ResponseEntity.ok("Contraseña actualizada correctamente");

    } catch (RuntimeException e) {

        return ResponseEntity
                .badRequest()
                .body(e.getMessage());
    }
    }

}