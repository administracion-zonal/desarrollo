package com.administracionzonal.dto;

import lombok.Data;
import java.util.List;
@Data
public class PerfilUsuarioDTO {

    private Long idUsuario;
    private String nombres;
    private String correo;
    private String fotoPerfil;
    private String tipoUsuario;
    private List<String> roles;

    private String institucion;

    // institucional
    private String direccion;
    private String Unidad;
    private String cargo;
    private String correoInstitucional;
    private String telefonoExtension;
}