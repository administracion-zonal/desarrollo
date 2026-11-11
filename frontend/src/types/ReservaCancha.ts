export interface ReservaCancha {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  qrToken: string;
  estado: "RESERVADO" | "ASISTIO" | "NO_ASISTIO" | "CANCELADO";
  asistio?: boolean;
  noAsistio?: boolean;
  usuario?: {
    cedula?: string;
    nombres?: string;
  } | null;
}
