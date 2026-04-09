export interface VehiculoReserva {
  idReserva?: number;

  idUsuario?: number;
  idChofer?: number;

  fechaReserva: string;
  horaInicio: string;
  horaFin: string;

  destino: string;
  observaciones?: string;
  estado?: string;
}
