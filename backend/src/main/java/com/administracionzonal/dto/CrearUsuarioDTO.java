
package com.administracionzonal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CrearUsuarioDTO {
    @NotBlank
    @Pattern(regexp = "\\d{10}", message = "La cédula debe tener 10 dígitos")
    private String cedula;
    private String nombres;
    private Long idChecklist;

}
