package com.administracionzonal.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String cedula;
    private String nombres;
    private String password;
    private String correo;
    private Boolean aceptaAcuerdo;
}