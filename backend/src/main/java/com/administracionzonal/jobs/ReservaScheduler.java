package com.administracionzonal.jobs;

import com.administracionzonal.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class ReservaScheduler {

    private final ReservaService reservaService;

    @Scheduled(fixedRate = 60000) // cada 1 minuto
    public void controlarReservas() {
        reservaService.actualizarEstadosInasistencia();
    }
}
