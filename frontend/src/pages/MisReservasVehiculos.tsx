import { useEffect } from "react";
import { useVehiculos } from "../hooks/useVehiculos";
import type { VehiculoReserva } from "../types/VehiculoReserva";

export default function MisReservasVehiculos() {
  const { data, cargarMis } = useVehiculos();

  useEffect(() => {
    cargarMis();
  }, []);

  return (
    <div>
      <h2>Mis Reservas Vehículos</h2>

      {data.map((r: VehiculoReserva) => (
        <div key={r.idReserva}>
          <p>{r.destino}</p>
          <p>{r.estado}</p>
        </div>
      ))}
    </div>
  );
}
