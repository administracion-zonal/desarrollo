package com.administracionzonal.dto;

public record DocumentoTipoTHDTO(
        Long idDocumentoTipo,
        String nombre,
        String tipoProceso,
        boolean plantillaDisponible,
        String plantillaNombre) {
}
