
package com.administracionzonal.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.administracionzonal.entity.Direccion;

@Repository
public interface DireccionRepository extends JpaRepository<Direccion, Long> {

}