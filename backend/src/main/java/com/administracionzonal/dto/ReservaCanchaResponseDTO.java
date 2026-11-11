package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaCanchaResponseDTO(
        Long id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        String qrToken,
        String estado,
        boolean asistio,
        boolean noAsistio,
        UsuarioCanchaDTO usuario) {

    public record UsuarioCanchaDTO(String cedula, String nombres) {
    }
}
