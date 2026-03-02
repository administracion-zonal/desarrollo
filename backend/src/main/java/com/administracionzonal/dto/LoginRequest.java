package com.administracionzonal.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String cedula;
    private String password;
}
