package com.administracionzonal.dto;

import com.administracionzonal.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private Long idUsuario;
    private String token;
    private String nombres;
    private String rol;
    private String fotoPerfil;
}