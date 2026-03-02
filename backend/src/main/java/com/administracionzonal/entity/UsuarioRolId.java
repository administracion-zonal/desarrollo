package com.administracionzonal.entity;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioRolId implements Serializable {

    private Long idUsuario;
    private Long idRol;
}
