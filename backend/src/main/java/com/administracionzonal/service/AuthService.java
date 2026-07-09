package com.administracionzonal.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.administracionzonal.dto.AuthResponseDTO;
import com.administracionzonal.dto.LoginRequest;
import com.administracionzonal.dto.RegisterRequest;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.ReservaCanchaRepository;
import com.administracionzonal.repository.ReservaRepository;
import com.administracionzonal.repository.RolRepository;
import com.administracionzonal.repository.UsuarioRepository;
import com.administracionzonal.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UsuarioRepository usuarioRepository;
        private final RolRepository rolRepository;
        private final ReservaRepository reservaRepository;
        private final ReservaCanchaRepository reservaCanchaRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;

        public AuthResponseDTO login(LoginRequest request) {

                Usuario usuario = usuarioRepository
                                .findByCedula(request.getCedula())
                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

                if (!passwordEncoder.matches(
                                request.getPassword(),
                                usuario.getPassword())) {
                        throw new RuntimeException("Credenciales invalidas");
                }

                List<String> roles = usuario.getRoles()
                                .stream()
                                .map(rolUsuario -> rolUsuario.getNombre())
                                .toList();

                boolean esAdmin = roles.contains("ADMIN");
                boolean esBloqueable = roles.contains("PRIVADO")
                                || roles.contains("ESTUDIANTE")
                                || roles.contains("SERVIDOR_PUBLICO");

                // ADMIN nunca debe quedar bloqueado.
                if (esAdmin && Boolean.TRUE.equals(usuario.getBloqueado())) {
                        usuario.setBloqueado(false);
                        usuario.setMotivoBloqueo(null);
                        usuario.setUpdatedAt(LocalDateTime.now());
                        usuario.setUpdatedBy("sistema");
                        usuarioRepository.save(usuario);
                }

                if (!esAdmin && Boolean.TRUE.equals(usuario.getBloqueado())) {
                        throw new RuntimeException("Usuario bloqueado. Solicite reactivacion a un administrador");
                }

                long faltasCoworking = 0;
                long faltasCancha = 0;

                if (!esAdmin && esBloqueable) {
                        faltasCoworking = reservaRepository.countByUsuario_CedulaAndNoAsistioTrue(usuario.getCedula());
                        faltasCancha = reservaCanchaRepository
                                        .countByUsuario_CedulaAndNoAsistioTrue(usuario.getCedula());
                }

                if (!esAdmin && esBloqueable && (faltasCoworking + faltasCancha) > 2) {
                        usuario.setBloqueado(true);
                        usuario.setMotivoBloqueo("Bloqueo automatico por mas de 2 inasistencias registradas");
                        usuario.setUpdatedAt(LocalDateTime.now());
                        usuario.setUpdatedBy("sistema");
                        usuarioRepository.save(usuario);
                        throw new RuntimeException("Usuario bloqueado por inasistencias. Contacte al administrador");
                }

                usuario.setLastLoginAt(LocalDateTime.now());
                usuario.setUpdatedAt(LocalDateTime.now());
                usuario.setUpdatedBy(usuario.getCedula());
                usuarioRepository.save(usuario);

                String token = jwtUtil.generateToken(usuario.getCedula(), roles);

                return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), roles,
                                usuario.getFotoPerfil(),
                                usuario.getDebeCambiarPassword(),
                                usuario.getAceptaAcuerdo(), usuario.getCedula(), usuario.getCorreo(),
                                usuario.getInstitucion());
        }

        public AuthResponseDTO register(RegisterRequest request) {

                if (!Boolean.TRUE.equals(request.getAceptaAcuerdo())) {
                        throw new RuntimeException("Debe aceptar el acuerdo de responsabilidad");
                }

                if (usuarioRepository.existsByCedula(request.getCedula())) {
                        throw new IllegalArgumentException("La cedula ya esta registrada");
                }

                if (usuarioRepository.existsByCorreo(request.getCorreo())) {
                        throw new IllegalArgumentException("Correo ya registrado");
                }

                Usuario usuario = new Usuario();
                usuario.setCedula(request.getCedula());
                usuario.setNombres(request.getNombres());
                usuario.setCorreo(request.getCorreo());
                // CIFRAR CONTRASENA
                usuario.setPassword(
                                passwordEncoder.encode(request.getPassword()));
                usuario.setDebeCambiarPassword(true);
                usuario.setAceptaAcuerdo(true);
                usuario.setCreatedAt(LocalDateTime.now());
                usuario.setUpdatedAt(LocalDateTime.now());
                usuario.setCreatedBy(request.getCedula());
                usuario.setUpdatedBy(request.getCedula());

                String rolSolicitado = normalizarTipoRegistro(request.getTipoRegistro());
                usuario.setTipoUsuario(rolSolicitado);

                Rol rol = rolRepository.findByNombre(rolSolicitado)
                                .orElseThrow(() -> new RuntimeException("Rol " + rolSolicitado + " no existe"));

                usuario.getRoles().add(rol);

                usuarioRepository.save(usuario);

                List<String> roles = usuario.getRoles()
                                .stream()
                                .map(rolUsuario -> rolUsuario.getNombre())
                                .toList();

                String token = jwtUtil.generateToken(usuario.getCedula(), roles);
                return new AuthResponseDTO(usuario.getIdUsuario(), token, usuario.getNombres(), roles,
                                usuario.getFotoPerfil(),
                                true, true, usuario.getCedula(), usuario.getCorreo(), usuario.getInstitucion());
        }

        private String normalizarTipoRegistro(String tipoRegistro) {
                String valor = tipoRegistro == null ? "PRIVADO" : tipoRegistro.trim().toUpperCase(Locale.ROOT);

                if (!valor.equals("PRIVADO") && !valor.equals("SERVIDOR_PUBLICO") && !valor.equals("ESTUDIANTE")) {
                        throw new IllegalArgumentException("Tipo de usuario no valido");
                }

                return valor;
        }
}
