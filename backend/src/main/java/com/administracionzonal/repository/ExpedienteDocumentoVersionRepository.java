package com.administracionzonal.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.administracionzonal.entity.ExpedienteDocumentoVersion;

public interface ExpedienteDocumentoVersionRepository
        extends JpaRepository<ExpedienteDocumentoVersion, Long> {
    List<ExpedienteDocumentoVersion> findByIdExpedienteOrderBySubidoEnDescIdDesc(Long idExpediente);

    Optional<ExpedienteDocumentoVersion>
            findFirstByIdExpedienteAndCategoriaIgnoreCaseOrderByVersionDesc(
                    Long idExpediente, String categoria);

    Optional<ExpedienteDocumentoVersion> findByIdAndIdExpediente(Long id, Long idExpediente);
}
