package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.administracionzonal.entity.DenominacionPuesto;

@Repository
public interface DenominacionPuestoRepository extends JpaRepository<DenominacionPuesto, Long> {

}