package com.administracionzonal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChoferDTO {

    private Long idUsuario;
    private String nombres;
    private String cedula;
    private String correo;

    public ChoferDTO(Long idUsuario, String nombres, String cedula, String correo) {
        this.idUsuario = idUsuario;
        this.nombres = nombres;
        this.cedula = cedula;
        this.correo = correo;

    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public String getNombres() {
        return nombres;
    }

    public String getCedula() {
        return cedula;
    }
}