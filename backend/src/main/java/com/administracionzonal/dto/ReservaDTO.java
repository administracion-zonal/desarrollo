package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Data;

@Data
public class ReservaDTO {
    private String cedula;
    private String nombres;
    private String nombreInstitucion;
    private String nombreArea;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private Boolean aceptaAcuerdo;
    private String correo;
    private String fotoPerfil;
    private String tipoUsuario;
    public Boolean getAceptaAcuerdo() {
        return aceptaAcuerdo;
    }

    public void setAceptaAcuerdo(Boolean aceptaAcuerdo) {
        this.aceptaAcuerdo = aceptaAcuerdo;
    }
}
