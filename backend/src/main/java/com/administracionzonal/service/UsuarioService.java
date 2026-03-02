package com.administracionzonal.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import com.administracionzonal.entity.Rol;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.RolRepository;
import com.administracionzonal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.administracionzonal.dto.CambioPasswordDTO;

@Service
@RequiredArgsConstructor
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepo;
    private final RolRepository rolRepo;
    private final PasswordEncoder passwordEncoder;


    public Usuario save(Usuario usuario) {
        return usuarioRepo.save(usuario);
    }

    public Usuario obtenerOcrearUsuario(
            String cedula,
            String nombres,
            String institucion,
            String tipoUsuario,
            String correo
    ) {

        return usuarioRepo.findByCedula(cedula).orElseGet(() -> {

        if (!tipoUsuario.equals("PRIVADO")
                        && !tipoUsuario.equals("ESTUDIANTE")) {
                    throw new RuntimeException("Tipo de usuario no permitido");
                }

            if (correo == null || correo.isBlank()) {
                throw new RuntimeException("El correo es obligatorio");
            }

            Usuario u = new Usuario();
            u.setCedula(cedula);
            u.setNombres(nombres);
            u.setInstitucion(institucion);
            u.setTipoUsuario(tipoUsuario);
u.setCorreo(correo.toLowerCase());
            u.setPassword(passwordEncoder.encode("Quito2026"));
            
            u.setDebeCambiarPassword(true);

            u.setAceptaAcuerdo(false);

            u = usuarioRepo.save(u);


            // 🔑 nombre del rol (ajústalo si deseas)
            String nombre = "PRIVADO";

            Rol rol = rolRepo.findByNombre(nombre)
                    .orElseGet(() -> {
                        Rol nuevoRol = new Rol();
                        nuevoRol.setNombre(nombre);
                        nuevoRol.setDescripcion("Rol externo");
                        return rolRepo.save(nuevoRol);
                    });

            // 👉 asignar rol al usuario
            u.getRoles().add(rol);

            // 🔥 AQUÍ estaba el error: FALTABA RETORNAR
            return usuarioRepo.save(u);
        });
    }

    public void cambiarPassword(CambioPasswordDTO dto, String cedula) {

        if (dto.getPasswordActual() == null || dto.getPasswordNueva() == null) {
            throw new RuntimeException("Datos incompletos");
        }

        Usuario usuario = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(dto.getPasswordActual(), usuario.getPassword())) {
            throw new RuntimeException("Contraseña actual incorrecta");
        }

        String regex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$";

        if (!dto.getPasswordNueva().matches(regex)) {
            throw new RuntimeException("La contraseña no cumple los requisitos");
        }

        usuario.setPassword(passwordEncoder.encode(dto.getPasswordNueva()));

        usuarioRepo.save(usuario);
    }

}
