package com.administracionzonal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "usuarios_institucion", schema = "administracionzonal")
@Getter
@Setter
public class UsuarioInstitucion {

    @Id
    @Column(name = "id_usuario_institucion")
    private Long idUsuarioInstitucion;

    @OneToOne
    @MapsId
    @JoinColumn(name = "id_usuario_institucion")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_denominacion")
    private DenominacionPuesto denominacion;

    private String departamento;

    @Column(name = "correo_institucional")
    private String correoInstitucional;

    @Column(name = "telefono_extension")
    private String telefonoExtension;

    private Boolean activo;

    private String institucion;

    @ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "id_unidad")
private Unidad unidad;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "id_direccion")
private Direccion direccion;
}