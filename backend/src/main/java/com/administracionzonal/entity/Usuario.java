package com.administracionzonal.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "usuarios", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;
    @Column(unique = true, nullable = false)
    private String cedula;
    private String nombres;
    private String institucion;
    
    @Column(nullable = false, unique = true)
    private String correo;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "debe_cambiar_password", nullable = false)
    private Boolean debeCambiarPassword = true;

    @Column(name = "tipo_usuario")
    private String tipoUsuario;

    @Column(name = "acepta_acuerdo")
    private Boolean aceptaAcuerdo = false;

@Column(name="foto_perfil")
private String fotoPerfil;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "usuarios_roles",
        schema = "administracionzonal",
        joinColumns = @JoinColumn(
            name = "id_usuario",           
            referencedColumnName = "id_usuario"
        ),
        inverseJoinColumns = @JoinColumn(
            name = "id_rol",               
            referencedColumnName = "id_rol"
        )
)
private Set<Rol> roles = new HashSet<>();



}
