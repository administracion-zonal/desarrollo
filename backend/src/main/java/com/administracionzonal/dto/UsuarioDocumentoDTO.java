package com.administracionzonal.dto;

public class UsuarioDocumentoDTO {
    private Long id;
    private Long idDocumentoTipo;
    private String nombre;
    private String estado;
    private String tipo;
    private boolean archivoDisponible;
    private String observacionRevision;
    private boolean obligatorio;
    private boolean incluidoEnChecklist;
    private String archivoExtension;
    private boolean plantillaDisponible;
    private String plantillaNombre;

    public UsuarioDocumentoDTO(Long id, Long idDocumentoTipo, String nombre, String estado, String tipo,
            boolean archivoDisponible, String observacionRevision, boolean obligatorio,
            boolean incluidoEnChecklist, String archivoExtension,
            boolean plantillaDisponible, String plantillaNombre) {

        this.id = id;

        this.idDocumentoTipo = idDocumentoTipo;
        this.nombre = nombre;
        this.estado = estado;
        this.tipo = tipo;
        this.archivoDisponible = archivoDisponible;
        this.observacionRevision = observacionRevision;
        this.obligatorio = obligatorio;
        this.incluidoEnChecklist = incluidoEnChecklist;
        this.archivoExtension = archivoExtension;
        this.plantillaDisponible = plantillaDisponible;
        this.plantillaNombre = plantillaNombre;
    }

    public Long getId() {
        return id;
    }

    public Long getIdDocumentoTipo() {
        return idDocumentoTipo;
    }

    public String getNombre() {
        return nombre;
    }

    public String getEstado() {
        return estado;
    }

    public String getTipo() {
        return tipo;
    }

    public boolean isArchivoDisponible() {
        return archivoDisponible;
    }

    public String getObservacionRevision() {
        return observacionRevision;
    }

    public boolean isObligatorio() {
        return obligatorio;
    }

    public boolean isIncluidoEnChecklist() {
        return incluidoEnChecklist;
    }

    public boolean isPlantillaDisponible() {
        return plantillaDisponible;
    }

    public String getArchivoExtension() {
        return archivoExtension;
    }

    public String getPlantillaNombre() {
        return plantillaNombre;
    }
}