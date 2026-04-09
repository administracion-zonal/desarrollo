package com.administracionzonal.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "checklist_detalle", schema = "administracionzonal")
@Data
public class ChecklistDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idChecklist;
    private Long idDocumentoTipo;
    private Boolean obligatorio;
}