import { useEffect, useState } from "react";
import ActionIconButton from "../components/ActionIconButton";
import { apiFetch } from "../utils/api";

type ReservaAprobada = {
  idReserva: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  destino: string;
  estado: string;
  estadoViaje?: string;
  nombreSolicitante?: string;
  cedulaSolicitante?: string;
  nombreChofer?: string;
  cedulaChofer?: string;
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  placaVehiculo?: string;
};

export default function AdminReservasAprobadasVehiculo() {
  const [reservas, setReservas] = useState<ReservaAprobada[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setError(null);
    apiFetch("/api/vehiculos/admin/aprobadas")
      .then((res) => res.json())
      .then(setReservas)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Error al cargar reservas"),
      );
  };

  useEffect(() => {
    cargar();
  }, []);

  const visibles = (() => {
    const ahora = new Date();
    return reservas.filter((r) => {
      const fecha = new Date(`${r.fechaReserva}T${r.horaFin}`);
      return fecha.getTime() >= ahora.getTime();
    });
  })();

  const rastrear = (destino: string) => {
    const query = encodeURIComponent(destino || "Quito");
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
    );
  };

  return (
    <section className="page-shell admin-solicitudes">
      <h2 className="page-title">Reservas aprobadas</h2>

      {error && <p className="error">{error}</p>}

      <div className="section-panel table-wrap">
        <table className="reservas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Solicitante</th>
              <th>Chofer</th>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.idReserva}>
                <td>{r.idReserva}</td>
                <td>{r.nombreSolicitante || "-"}</td>
                <td>{r.nombreChofer || "-"}</td>
                <td>
                  {[r.marcaVehiculo, r.modeloVehiculo, r.placaVehiculo]
                    .filter(Boolean)
                    .join(" - ") || "-"}
                </td>
                <td>{r.fechaReserva}</td>
                <td>
                  {r.horaInicio} - {r.horaFin}
                </td>
                <td>{r.destino}</td>
                <td>{r.estadoViaje || "PENDIENTE"}</td>
                <td>
                  <ActionIconButton
                    icon="📍"
                    label="Rastrear"
                    variant="primary"
                    onClick={() => rastrear(r.destino)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
