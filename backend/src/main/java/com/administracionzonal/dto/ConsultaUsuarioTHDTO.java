package com.administracionzonal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ConsultaUsuarioTHDTO {
    private boolean existe;
    private String nombres;
}
