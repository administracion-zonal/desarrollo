package com.administracionzonal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChecklistConfiguracionDTO {
    private Long idChecklist;
    private String tipo;
    private String nombre;
    private int cantidadDocumentos;
}
