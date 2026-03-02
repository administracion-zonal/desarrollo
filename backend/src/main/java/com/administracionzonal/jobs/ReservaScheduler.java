package com.administracionzonal.jobs;

import com.administracionzonal.entity.ReservaCoworking;
import com.administracionzonal.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class ReservaScheduler {

    private final ReservaRepository repo;

    @Scheduled(fixedRate = 60000) // cada 1 minuto
    public void controlarReservas() {

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();

        List<ReservaCoworking> reservas = repo.findActivasHoy(hoy);

        for (ReservaCoworking r : reservas) {

            // pierde por no llegar (10 min tarde)
            if (!r.isAsistio()
                && ahora.isAfter(r.getHoraInicio().plusMinutes(10))) {

                r.setNoAsistio(true);
                repo.save(r);
            }

            // aviso 5 min antes de fin
            if (ahora.equals(r.getHoraFin().minusMinutes(5))) {
                System.out.println(
                  "Reserva " + r.getId() + " termina en 5 minutos"
                );
            }
        }
    }
}
