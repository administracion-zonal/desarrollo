/* ============================
   VALIDAR CÉDULA ECUATORIANA
============================ */
export const validarCedula = (cedula: string): boolean => {
  if (!cedula) return false;

  if (!/^\d{10}$/.test(cedula)) return false;

  const digitos = cedula.split("").map(Number);

  const provincia = digitos[0] * 10 + digitos[1];

  if (provincia < 1 || provincia > 24) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];

  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i];

    if (valor >= 10) valor -= 9;

    suma += valor;
  }

  const verificador = (10 - (suma % 10)) % 10;

  return verificador === digitos[9];
};

/* ============================
   SOLO NÚMEROS
============================ */
export const soloNumeros = (valor: string): boolean => {
  return /^\d+$/.test(valor);
};

/* ============================
   VALIDAR CORREO
============================ */
export const validarCorreo = (correo: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
};

/* ============================
   SOLO TEXTO
============================ */
export const soloTexto = (texto: string): boolean => {
  return /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(texto);
};

/* =========================
     VALIDAR PASSWORD SEGURA
  ========================= */
export const validarPassword = (password: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
};

/* =========================
     FORMATO FECHAS LARGAS
  ========================= */

export const formatearFecha = (fecha: string) => {
  const [anio, mes, dia] = fecha.split("-");

  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return `${Number(dia)} de ${meses[Number(mes) - 1]} de ${anio}`;
};
