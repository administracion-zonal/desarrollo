package com.administracionzonal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "documentos_tipo")
public class DocumentoTipo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_documento_tipo")
    private Long idDocumentoTipo;

    private String nombre;

    private String tipoProceso;

    // GETTERS

    public Long getIdDocumentoTipo() {
        return idDocumentoTipo;
    }

    public String getNombre() {
        return nombre;
    }

    public String getTipoProceso() {
        return tipoProceso;
    }
}