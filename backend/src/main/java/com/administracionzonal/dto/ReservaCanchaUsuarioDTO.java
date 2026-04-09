package com.administracionzonal.dto;

import lombok.Data;

@Data
public class ReservaCanchaUsuarioDTO {

    private Long id;

    private String fecha;
    private String horaInicio;
    private String horaFin;

    private boolean vigente;
    private boolean puedeCancelar;

    private String estado;
    private String qrToken;
}