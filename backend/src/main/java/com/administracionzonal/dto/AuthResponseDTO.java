package com.administracionzonal.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDTO {
    private Long idUsuario;
    private String token;
    private String nombres;
    private List<String> roles;
    private String fotoPerfil;
    private Boolean cambiarPassword;
    private Boolean aceptaAcuerdo;
    private String cedula;
    private String correo;
    private String institucion;
}