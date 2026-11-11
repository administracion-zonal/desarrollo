export const fechaActualLocal = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

export const esFinDeSemana = (fecha: string) => {
  const dia = new Date(fecha + "T00:00:00").getDay();
  return dia === 0 || dia === 6;
};

export const esDiaHabil = (fecha: string) => {
  const dia = new Date(fecha + "T00:00:00").getDay();
  return dia !== 0 && dia !== 6;
};
