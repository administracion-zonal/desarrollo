package com.administracionzonal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AltaUsuarioResponseDTO {
    private Long idUsuario;
    private boolean creado;
    private String claveTemporal;
    private Long idProceso;
}
