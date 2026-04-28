package com.administracionzonal.dto;

import java.util.List;

import lombok.Data;

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

    private Long direccionId;
    private String direccion;

    private Long unidadId;
    private String unidad;

    private Long cargoId;
    private String cargo;
    private String correoInstitucional;
    private String telefonoExtension;
}