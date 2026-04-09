package com.administracionzonal.dto;

public class UsuarioDocumentoDTO {
    private Long id;
    private Long idDocumentoTipo;
    private String nombre;
    private String estado;
    private String tipo;
    private String rutaArchivo;

    public UsuarioDocumentoDTO(Long id, Long idDocumentoTipo, String nombre, String estado, String tipo,
            String rutaArchivo) {

        this.id = id;

        this.idDocumentoTipo = idDocumentoTipo;
        this.nombre = nombre;
        this.estado = estado;
        this.tipo = tipo;
        this.rutaArchivo = rutaArchivo;
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

    public String getRutaArchivo() {
        return rutaArchivo;
    }
}