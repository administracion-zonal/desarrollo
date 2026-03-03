package com.administracionzonal.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.*;

@Entity
@Table(name = "reservas_coworking", schema = "administracionzonal")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReservaCoworking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "nombre_institucion", nullable = false)
    private String nombreInstitucion;

    @Column(name = "nombre_area", nullable = false)
    private String nombreArea;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "qr_token", unique = true)
    private String qrToken;

    private boolean usado = false;

    private boolean asistio = false;
    private boolean noAsistio = false;
}
