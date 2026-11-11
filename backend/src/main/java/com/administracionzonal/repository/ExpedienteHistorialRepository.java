package com.administracionzonal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.ExpedienteHistorial;

public interface ExpedienteHistorialRepository extends JpaRepository<ExpedienteHistorial, Long> {
    List<ExpedienteHistorial> findByIdExpedienteOrderByFechaDescIdDesc(Long idExpediente);
}
