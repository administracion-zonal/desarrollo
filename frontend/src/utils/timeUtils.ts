export const HORA_MIN = "08:00";
export const HORA_MAX = "16:30";

export const toMinutes = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const generarBloques = (
  horaInicio = HORA_MIN,
  horaFin = HORA_MAX,
  incluirHoraFin = false,
) => {
  const bloques: string[] = [];
  let t = toMinutes(horaInicio);
  const max = toMinutes(horaFin);

  while (incluirHoraFin ? t <= max : t < max) {
    bloques.push(
      `${Math.floor(t / 60)
        .toString()
        .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`,
    );
    t += 30;
  }

  return bloques;
};

export const esBloquePasado = (fechaISO: string, hora: string) => {
  if (!fechaISO) return false;

  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hoyISO = `${yyyy}-${mm}-${dd}`;

  if (fechaISO !== hoyISO) return false;

  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();
  const minutosBloque = toMinutes(hora);

  return minutosBloque <= minutosAhora;
};
