import { useEffect } from "react";
import ActionIconButton from "../components/ActionIconButton";
import { useVehiculos } from "../hooks/useVehiculos";
import { vehiculosService } from "../services/vehiculosService";
import type { VehiculoReserva } from "../types/VehiculoReserva";

export default function AdminVehiculos() {
  const { data, cargarTodas } = useVehiculos();

  useEffect(() => {
    cargarTodas();
  }, [cargarTodas]);

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
    try {
      const blob = await vehiculosService.pdf(id);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `salvoconducto_${id}.pdf`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Error al descargar PDF");
    }
  };

  return (
    <section className="page-shell is-compact">
      <h2 className="page-title">Administrar vehículos</h2>

      <div className="section-panel">
        {data.map((r: VehiculoReserva) => (
          <div
            key={r.idReserva}
            className="actions-inline"
            style={{
              justifyContent: "space-between",
              width: "100%",
              marginBottom: "1rem",
            }}
          >
            <div>
              <strong>{r.destino}</strong>
              <div>{r.estado}</div>
            </div>

            <div className="actions-inline">
              <ActionIconButton
                icon="✓"
                label="Aprobar"
                variant="success"
                onClick={() => aprobar(r.idReserva!)}
              />
              <ActionIconButton
                icon="✕"
                label="Rechazar"
                variant="danger"
                onClick={() => rechazar(r.idReserva!)}
              />
              <ActionIconButton
                icon="👤"
                label="Asignar chofer"
                variant="warning"
                onClick={() => asignar(r.idReserva!)}
              />
              <ActionIconButton
                icon="⬇"
                label="Descargar PDF"
                variant="primary"
                onClick={() => descargar(r.idReserva!)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
