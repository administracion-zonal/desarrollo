package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.DocumentoTipo;

public interface DocumentoTipoRepository extends JpaRepository<DocumentoTipo, Long> {
}