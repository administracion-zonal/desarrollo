export type ReservaUsuario = {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  nombreArea: string;
  nombreInstitucion: string;
  vigente: boolean;
  puedeCancelar: boolean;
  qrToken?: string;
};