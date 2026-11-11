package com.administracionzonal.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.administracionzonal.entity.ExpedienteCompra;
import jakarta.persistence.LockModeType;

public interface ExpedienteCompraRepository extends JpaRepository<ExpedienteCompra, Long> {
    List<ExpedienteCompra> findAllByOrderByCreatedAtDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM ExpedienteCompra e WHERE e.id = :id")
    java.util.Optional<ExpedienteCompra> findByIdForUpdate(@Param("id") Long id);
}
