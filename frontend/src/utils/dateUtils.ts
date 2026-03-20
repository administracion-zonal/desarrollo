export const esFinDeSemana = (fecha: string) => {
  const dia = new Date(fecha + "T00:00:00").getDay();
  return dia === 0 || dia === 6;
};

export const esDiaHabil = (fecha: string) => {
  const dia = new Date(fecha + "T00:00:00").getDay();
  return dia !== 0 && dia !== 6;
};
