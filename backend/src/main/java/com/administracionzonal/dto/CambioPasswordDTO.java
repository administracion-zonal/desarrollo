package com.administracionzonal.dto;

import lombok.Data;

@Data
public class CambioPasswordDTO {
    private String passwordActual;
    private String passwordNueva;
}