package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.administracionzonal.entity.Unidad;

@Repository
public interface UnidadRepository extends JpaRepository<Unidad, Long> {

}