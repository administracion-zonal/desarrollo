package com.administracionzonal.dto;

public class BloqueHorarioDTO {

    private String hora;      
    private int ocupados;     
    private int capacidad;
        
    public BloqueHorarioDTO(String hora, int ocupados, int capacidad) {
        this.hora = hora;
        this.ocupados = ocupados;
        this.capacidad = capacidad;
    }

    public String getHora() {
        return hora;
    }

    public int getOcupados() {
        return ocupados;
    }

    public int getCapacidad() {
        return capacidad;
    }

    public int getDisponibles() {
        return capacidad - ocupados;
    }
}
