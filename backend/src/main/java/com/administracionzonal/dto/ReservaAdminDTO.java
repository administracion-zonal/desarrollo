package com.administracionzonal.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class ReservaAdminDTO {

    private Long id;

    private String cedula;
    private String nombres;
    private String correo;

    private String fecha;
    private String horaInicio;
    private String horaFin;

    private String nombreArea;
    private String nombreInstitucion;
    private Integer numeroPersonas;
    private String estado;

    private boolean asistio;
    private boolean noAsistio;
    private boolean usado;
    private String qrToken;
    private LocalDateTime fechaCreacion;
}