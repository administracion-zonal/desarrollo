package com.administracionzonal.security;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.stream.Collectors;
import com.administracionzonal.entity.Usuario;
import com.administracionzonal.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepo;

    @Override
    public UserDetails loadUserByUsername(String cedula) {
        Usuario u = usuarioRepo.findByCedula(cedula)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        return User.builder()
                .username(u.getCedula())
                .password(u.getPassword())
                .authorities(
                        u.getRoles()
                                .stream()
                                .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getNombre()))
                                .collect(Collectors.toList())
                )
                .build();
    }
}
