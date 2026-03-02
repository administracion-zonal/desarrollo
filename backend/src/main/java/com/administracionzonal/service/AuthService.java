package com.administracionzonal.service;

import com.administracionzonal.dto.LoginRequest;
import com.administracionzonal.dto.RegisterRequest;
import com.administracionzonal.dto.AuthResponseDTO;

import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponseDTO login(LoginRequest request) {

        Usuario usuario = usuarioRepository
            .findByCedula(request.getCedula())
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                usuario.getPassword()
        )) {
            throw new RuntimeException("Credenciales inválidas");
        }

// Tomamos el primer rol (por ahora)
    String rol = usuario.getRoles()
        .stream()
        .map(Rol::getNombre)
        .anyMatch(r -> r.equals("ADMIN"))
            ? "ADMIN"
            : "PRIVADO";

        String token = jwtUtil.generateToken(usuario.getCedula(), "ROLE_" + rol);

        return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), rol, usuario.getFotoPerfil());
    }

    public AuthResponseDTO register(RegisterRequest request) {

        if (usuarioRepository.existsByCedula(request.getCedula())) {
            throw new IllegalArgumentException("La cédula ya está registrada");
        }

        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new IllegalArgumentException("Correo ya registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setCedula(request.getCedula());
        usuario.setNombres(request.getNombres());
         usuario.setCorreo(request.getCorreo());
        // 🔐 CIFRAR CONTRASEÑA
        usuario.setPassword(
            passwordEncoder.encode(request.getPassword())
        );
        usuario.setDebeCambiarPassword(true);
        String rol = "PRIVADO";
        
        usuarioRepository.save(usuario);
        // 🎟️ TOKEN
        String token = jwtUtil.generateToken(usuario.getCedula(), "ROLE_" + rol);

        return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), rol, usuario.getFotoPerfil());
    }
}
