package com.administracionzonal.dto;

import jakarta.validation.constraints.NotNull;

public class AprobarSolicitudRequest {
    @NotNull
    private Long idChofer;

    public Long getIdChofer() {
        return idChofer;
    }

    public void setIdChofer(Long idChofer) {
        this.idChofer = idChofer;
    }
}