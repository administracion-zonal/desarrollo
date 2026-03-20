export const HORA_MIN = "08:00";
export const HORA_MAX = "16:00";

export const toMinutes = (hora: string) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const generarBloques = () => {
  const bloques: string[] = [];
  let t = toMinutes(HORA_MIN);
  const max = toMinutes(HORA_MAX);

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
