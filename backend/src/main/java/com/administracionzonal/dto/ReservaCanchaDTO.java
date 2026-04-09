package com.administracionzonal.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ReservaCanchaDTO {

    private String cedula;
    private String nombres;
    private String correo;
    private String nombreInstitucion;

    private LocalDate fecha;

                    private LocalTime horaInicio;
    private LocalTime horaFin;

}