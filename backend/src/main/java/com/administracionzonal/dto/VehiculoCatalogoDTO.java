package com.administracionzonal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehiculoCatalogoDTO {
    private Long idVehiculo;
    private String marca;
    private String modelo;
    private String placa;
    private String estado;
}
