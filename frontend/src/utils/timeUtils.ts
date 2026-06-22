export const HORA_MIN = "00:01";
export const HORA_MAX = "11:59";

export const toMinutes = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const parseFechaLocal = (fechaISO: string) => {
  const [year, month, day] = fechaISO.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const generarBloques = (fechaReserva?: string) => {
  const bloques: string[] = [];
  let t = toMinutes(HORA_MIN);
  const max = toMinutes(HORA_MAX);

  // Para reservas del día actual se bloquean automáticamente horas pasadas.
  if (fechaReserva) {
    const ahora = new Date();
    const fechaSeleccionada = parseFechaLocal(fechaReserva);
    const hoy = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
    );

    if (fechaSeleccionada.getTime() === hoy.getTime()) {
      const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
      const siguienteBloque = Math.ceil(minutosAhora / 30) * 30;
      t = Math.max(t, siguienteBloque);
    }
  }

  while (t < max) {
    bloques.push(
      `${Math.floor(t / 60)
        .toString()
        .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`,
    );
    t += 30;
  }

  return bloques;
};
