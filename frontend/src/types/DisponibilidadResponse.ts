
export interface BloqueHorario {
  hora: string;
  ocupados: number;
  capacidad: number;
}

export interface DisponibilidadResponse {
  area: string;
  bloques: BloqueHorario[];
}
