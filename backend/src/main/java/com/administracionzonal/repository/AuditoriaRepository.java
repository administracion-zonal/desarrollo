package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.Auditoria;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
}