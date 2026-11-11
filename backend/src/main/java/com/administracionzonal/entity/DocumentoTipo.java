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

    @Column(name = "plantilla_archivo")
    private String plantillaArchivo;

    @Column(name = "plantilla_nombre")
    private String plantillaNombre;

    @Column(name = "plantilla_extension")
    private String plantillaExtension;

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

    public String getPlantillaArchivo() {
        return plantillaArchivo;
    }

    public void setPlantillaArchivo(String plantillaArchivo) {
        this.plantillaArchivo = plantillaArchivo;
    }

    public String getPlantillaNombre() {
        return plantillaNombre;
    }

    public void setPlantillaNombre(String plantillaNombre) {
        this.plantillaNombre = plantillaNombre;
    }

    public String getPlantillaExtension() {
        return plantillaExtension;
    }

    public void setPlantillaExtension(String plantillaExtension) {
        this.plantillaExtension = plantillaExtension;
    }
}