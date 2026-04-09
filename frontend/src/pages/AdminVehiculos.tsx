import { useEffect } from "react";
import { useVehiculos } from "../hooks/useVehiculos";
import { vehiculosService } from "../services/vehiculosService";
import type { VehiculoReserva } from "../types/VehiculoReserva";

export default function AdminVehiculos() {
  const { data, cargarTodas } = useVehiculos();

  useEffect(() => {
    cargarTodas();
  }, []);

  const aprobar = async (id: number) => {
    await vehiculosService.aprobar(id);
    cargarTodas();
  };

  const rechazar = async (id: number) => {
    await vehiculosService.rechazar(id);
    cargarTodas();
  };

  const asignar = async (id: number) => {
    const input = prompt("ID Chofer");

    if (!input) {
      alert("Debe ingresar un ID");
      return;
    }

    const idChofer = Number(input);

    if (isNaN(idChofer)) {
      alert("Debe ser un número válido");
      return;
    }

    await vehiculosService.asignarChofer({
      idReserva: id,
      idChofer,
    });

    cargarTodas();
  };

  const descargar = async (id: number) => {
    const res = await vehiculosService.pdf(id);

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "salvoconducto.pdf";
    link.click();
  };

  return (
    <div>
      <h2>Admin Vehículos</h2>

      {data.map((r: VehiculoReserva) => (
        <div key={r.idReserva}>
          <p>{r.destino}</p>
          <p>{r.estado}</p>

          <button onClick={() => aprobar(r.idReserva!)}>Aprobar</button>
          <button onClick={() => rechazar(r.idReserva!)}>Rechazar</button>
          <button onClick={() => asignar(r.idReserva!)}>Chofer</button>
          <button onClick={() => descargar(r.idReserva!)}>PDF</button>
        </div>
      ))}
    </div>
  );
}
