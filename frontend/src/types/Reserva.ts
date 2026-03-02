import type { Usuario } from "./Usuario";

export type Reserva = {
  id: number;
  usuario: Usuario;
  nombreInstitucion: string;
  nombreArea: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoUsuario: string;
  qrToken?: string;
  aceptaAcuerdo: boolean;
  asistio: boolean;
  noAsistio: boolean;
  usado: boolean;
};
