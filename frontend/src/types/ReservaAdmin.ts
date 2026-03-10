export type ReservaAdmin = {
  id: number;

  cedula: string;
  nombres: string;
  correo: string;

  fecha: string;
  horaInicio: string;
  horaFin: string;

  nombreArea: string;
  nombreInstitucion: string;
  tipoUsuario: string;

  asistio: boolean;
  noAsistio: boolean;
  usado: boolean;
  qrToken: string;
  fechaCreacion: string;
};
