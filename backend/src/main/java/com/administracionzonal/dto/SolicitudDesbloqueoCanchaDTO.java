package com.administracionzonal.dto;

import java.time.LocalDateTime;

public record SolicitudDesbloqueoCanchaDTO(
        Long id,
        String cedula,
        String nombres,
        String estado,
        String observacion,
        LocalDateTime fechaSolicitud,
        LocalDateTime fechaResolucion,
        String resueltoPor) {
}
