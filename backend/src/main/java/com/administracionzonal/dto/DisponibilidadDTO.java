package com.administracionzonal.dto;

import java.util.List;

public class DisponibilidadDTO {

    private String area;
    private List<BloqueHorarioDTO> bloques;

    public DisponibilidadDTO(String area, List<BloqueHorarioDTO> bloques) {
        this.area = area;
        this.bloques = bloques;
    }

    public String getArea() {
        return area;
    }

    public List<BloqueHorarioDTO> getBloques() {
        return bloques;
    }
}
