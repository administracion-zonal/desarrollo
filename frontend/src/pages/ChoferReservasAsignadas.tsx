import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

type ReservaChofer = {
  idReserva: number;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  destino: string;
  observaciones: string;
  estado: string;
};

export default function ChoferReservasAsignadas() {
  const [reservas, setReservas] = useState<ReservaChofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/vehiculos/chofer")
      .then(async (res) => {
        return res.json();
      })
      .then(setReservas)
      .catch((e: unknown) => {
        if (e instanceof Error) {
          setError(e.message || "No se pudieron cargar las reservas");
        } else {
          setError("No se pudieron cargar las reservas");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const imprimirOrden = async (idReserva: number) => {
    try {
      const res = await apiFetch(
        `/api/vehiculos/chofer/orden-movilizacion/${idReserva}`,
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar la orden de movilizacion");
    }
  };

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Perfil chofer</span>
        <h2>Viajes pendientes</h2>
      </div>

      {loading && <p>Cargando reservas asignadas...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && reservas.length === 0 && (
        <p>No tiene reservas asignadas.</p>
      )}

      {!loading && !error && reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva) => (
              <tr key={reserva.idReserva}>
                <td>{reserva.fechaReserva}</td>
                <td>
                  {reserva.horaInicio} - {reserva.horaFin}
                </td>
                <td>{reserva.destino}</td>
                <td>
                  <span className="status-pill status-pill--info">
                    {reserva.estado}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn-primary"
                      onClick={() => imprimirOrden(reserva.idReserva)}
                    >
                      Imprimir orden
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
