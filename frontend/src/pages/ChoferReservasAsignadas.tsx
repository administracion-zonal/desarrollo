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
  salidaReal?: string | null;
  retornoReal?: string | null;
  kilometrajeInicial?: number | null;
  kilometrajeFinal?: number | null;
  novedades?: string | null;
};

export default function ChoferReservasAsignadas() {
  const [reservas, setReservas] = useState<ReservaChofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kilometrajes, setKilometrajes] = useState<Record<number, string>>({});
  const [novedades, setNovedades] = useState<Record<number, string>>({});
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = async () => {
    setError(null);
    try {
      const res = await apiFetch("/api/vehiculos/chofer");
      if (!res.ok) throw new Error(await res.text());
      setReservas(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const registrarMovimiento = async (idReserva: number, accion: "salida" | "retorno") => {
    const kilometraje = Number(kilometrajes[idReserva]);
    if (!Number.isSafeInteger(kilometraje) || kilometraje < 0) {
      setError("Ingrese un kilometraje válido.");
      return;
    }

    setError(null);
    setProcesando(idReserva);
    try {
      const res = await apiFetch(`/api/vehiculos/chofer/${idReserva}/${accion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          accion === "salida"
            ? { kilometrajeInicial: kilometraje }
            : { kilometrajeFinal: kilometraje, novedades: novedades[idReserva] || "" },
        ),
      });
      if (!res.ok) throw new Error(await res.text());
      setKilometrajes((actual) => ({ ...actual, [idReserva]: "" }));
      setNovedades((actual) => ({ ...actual, [idReserva]: "" }));
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo registrar el movimiento");
    } finally {
      setProcesando(null);
    }
  };

  const imprimirOrden = async (idReserva: number) => {
    try {
      const res = await apiFetch(
        `/api/vehiculos/chofer/orden-movilizacion/${idReserva}`,
      );
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar la orden de movilizacion");
    }
  };

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Perfil chofer</span>
        <h2>Viajes asignados</h2>
      </div>

      {loading && <p>Cargando reservas asignadas...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && reservas.length === 0 && (
        <p>No tiene reservas asignadas.</p>
      )}

      {!loading && reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Registro operativo</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((reserva) => (
              <tr key={reserva.idReserva}>
                <td>{reserva.fechaReserva}</td>
                <td>{reserva.horaInicio} - {reserva.horaFin}</td>
                <td>{reserva.destino}</td>
                <td>
                  <span className="status-pill status-pill--info">{reserva.estado}</span>
                </td>
                <td>
                  {reserva.estado === "APROBADA" && (
                    <div className="table-actions">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label="Kilometraje inicial"
                        placeholder="Km salida"
                        value={kilometrajes[reserva.idReserva] ?? ""}
                        onChange={(e) => setKilometrajes((actual) => ({
                          ...actual,
                          [reserva.idReserva]: e.target.value,
                        }))}
                      />
                      <button
                        className="btn-primary"
                        disabled={procesando === reserva.idReserva}
                        onClick={() => registrarMovimiento(reserva.idReserva, "salida")}
                      >
                        Registrar salida
                      </button>
                    </div>
                  )}
                  {reserva.estado === "EN_USO" && (
                    <div className="table-actions">
                      <input
                        type="number"
                        min={reserva.kilometrajeInicial ?? 0}
                        step="1"
                        aria-label="Kilometraje final"
                        placeholder="Km retorno"
                        value={kilometrajes[reserva.idReserva] ?? ""}
                        onChange={(e) => setKilometrajes((actual) => ({
                          ...actual,
                          [reserva.idReserva]: e.target.value,
                        }))}
                      />
                      <input
                        aria-label="Novedades del viaje"
                        placeholder="Novedades"
                        value={novedades[reserva.idReserva] ?? ""}
                        onChange={(e) => setNovedades((actual) => ({
                          ...actual,
                          [reserva.idReserva]: e.target.value,
                        }))}
                      />
                      <button
                        className="btn-primary"
                        disabled={procesando === reserva.idReserva}
                        onClick={() => registrarMovimiento(reserva.idReserva, "retorno")}
                      >
                        Registrar retorno
                      </button>
                    </div>
                  )}
                  {(reserva.estado === "APROBADA" || reserva.estado === "EN_USO") && (
                    <button
                      className="btn"
                      onClick={() => imprimirOrden(reserva.idReserva)}
                    >
                      Imprimir orden
                    </button>
                  )}
                  {reserva.estado === "FINALIZADA" && (
                    <span>
                      {reserva.kilometrajeInicial} km - {reserva.kilometrajeFinal} km
                      {reserva.novedades ? ` | ${reserva.novedades}` : ""}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
