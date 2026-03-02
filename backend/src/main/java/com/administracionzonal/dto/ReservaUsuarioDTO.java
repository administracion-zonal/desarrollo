package com.administracionzonal.dto;

import lombok.Data;
@Data
public class ReservaUsuarioDTO {

    private Long id;
    private String fecha;
    private String horaInicio;
    private String horaFin;
    private String nombreArea;
    private String nombreInstitucion;
    private boolean puedeCancelar;
    private boolean vigente;
    private String qrToken; // ⚠️ solo si está vigente
}