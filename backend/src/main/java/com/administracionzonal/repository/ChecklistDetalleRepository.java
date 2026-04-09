package com.administracionzonal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.ChecklistDetalle;

public interface ChecklistDetalleRepository extends JpaRepository<ChecklistDetalle, Long> {
    List<ChecklistDetalle> findByIdChecklist(Long idChecklist);
}
