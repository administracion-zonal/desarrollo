package com.administracionzonal.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "expediente_documento_versiones", schema = "administracionzonal")
@Getter
@Setter
@NoArgsConstructor
public class ExpedienteDocumentoVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_version")
    private Long id;

    @Column(name = "id_expediente", nullable = false)
    private Long idExpediente;

    @Column(nullable = false, length = 120)
    private String categoria;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "nombre_archivo", nullable = false, length = 255)
    private String nombreArchivo;

    @Column(name = "ruta_archivo", nullable = false, length = 1000)
    private String rutaArchivo;

    @Column(name = "tamano_bytes", nullable = false)
    private Long tamanoBytes;

    @Column(name = "subido_por", nullable = false, length = 100)
    private String subidoPor;

    @Column(name = "subido_en", nullable = false)
    private LocalDateTime subidoEn;
}
