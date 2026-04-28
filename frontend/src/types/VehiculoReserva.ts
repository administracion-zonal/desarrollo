export interface VehiculoReserva {
  idReserva: number;

  fechaReserva: string;
  horaInicio: string;
  horaFin: string;

  destino: string;
  observaciones: string;
  estado: string;

  nombreChofer: string;

  marcaVehiculo: string;
  modeloVehiculo: string;
  placaVehiculo: string;
}
