package com.administracionzonal.service;

import com.administracionzonal.dto.LoginRequest;
import com.administracionzonal.dto.RegisterRequest;
import com.administracionzonal.dto.AuthResponseDTO;

import com.administracionzonal.entity.Usuario;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.security.JwtUtil;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.administracionzonal.repository.RolRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
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
    List<String> roles = usuario.getRoles()
        .stream()
        .map(Rol::getNombre)
        .toList();

    String token = jwtUtil.generateToken(usuario.getCedula(), roles);

        return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), roles, usuario.getFotoPerfil(),
                usuario.getDebeCambiarPassword(),
                usuario.getAceptaAcuerdo(), usuario.getCedula(), usuario.getCorreo(), usuario.getInstitucion());
    }

    public AuthResponseDTO register(RegisterRequest request) {

         if (!Boolean.TRUE.equals(request.getAceptaAcuerdo())) {
            throw new RuntimeException("Debe aceptar el acuerdo de responsabilidad");
        }

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
        usuario.setAceptaAcuerdo(true);

        Rol rol = rolRepository.findByNombre("PRIVADO")
                .orElseThrow(() -> new RuntimeException("Rol PRIVADO no existe"));

        usuario.getRoles().add(rol);
        
        usuarioRepository.save(usuario);



 List<String> roles = usuario.getRoles()
    .stream()
    .map(Rol::getNombre)
    .toList();

String token = jwtUtil.generateToken(usuario.getCedula(), roles);
        return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), roles, usuario.getFotoPerfil(), true, true,  usuario.getCedula(), usuario.getCorreo(), usuario.getInstitucion());
    }
}
