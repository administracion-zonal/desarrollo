package com.administracionzonal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProcesoUsuarioDTO {
    private Long id;
    private String tipo;
    private String estado;
    private Long idChecklist;
    private String nombreChecklist;
}
