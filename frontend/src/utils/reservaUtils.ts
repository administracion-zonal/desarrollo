export const solapada = (
  inicio: string,
  fin: string,
  horasBloqueadas: string[],
) => {
  return horasBloqueadas.some((h) => {
    const [hi, hf] = h.split("-");
    return inicio < hf && fin > hi;
  });
};
