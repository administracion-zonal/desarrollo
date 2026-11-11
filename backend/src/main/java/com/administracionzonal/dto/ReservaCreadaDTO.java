package com.administracionzonal.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record ReservaCreadaDTO(
        Long id,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        String nombreArea,
        Integer numeroPersonas,
        String qrToken,
        String estado) {
}
