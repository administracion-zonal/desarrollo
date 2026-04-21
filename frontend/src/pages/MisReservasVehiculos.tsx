import { useEffect, useState } from "react";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import type { VehiculoReserva } from "../types/VehiculoReserva";
import { apiFetch } from "../utils/api";

export default function MisReservasVehiculos() {
  const [reservas, setReservas] = useState<VehiculoReserva[]>([]);
  const [detalle, setDetalle] = useState<VehiculoReserva | null>(null);

  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculo[]>([]);
  const [detalleSolicitud, setDetalleSolicitud] =
    useState<SolicitudVehiculo | null>(null);

  /* ================= CARGA ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    // 🔥 solicitudes
    apiFetch(`/api/vehiculos/solicitudes/mis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error solicitudes");
        return res.json();
      })
      .then(setSolicitudes)
      .catch(console.error);

    // ✅ reservas
    apiFetch(`/api/vehiculos/mis`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error reservas");
        return res.json();
      })
      .then(setReservas)
      .catch(console.error);
  }, []);

  /* ================= CANCELAR ================= */
  const cancelarSolicitud = async (id: number) => {
    const token = localStorage.getItem("token");

    if (!confirm("¿Deseas cancelar la solicitud?")) return;

    try {
      const res = await apiFetch(`/api/vehiculos/solicitudes/${id}/cancelar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error");

      // 🔥 eliminar SOLO de solicitudes
      setSolicitudes((prev) => prev.filter((r) => r.id !== id));

      if (detalleSolicitud?.id === id) {
        setDetalleSolicitud(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error al cancelar");
    }
  };
  /* ================= UI ================= */

  return (
    <>
      <h2>🚗 Mis Reservas Vehículos</h2>

      {/* ================= SOLICITUDES ================= */}
      {solicitudes.length > 0 && (
        <>
          <h3>📝 Solicitudes enviadas</h3>

          {solicitudes.length > 0 && (
            <table className="reservas-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destino</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.fecha}</td>
                    <td>{s.destino}</td>

                    <td>
                      <button onClick={() => setDetalleSolicitud(s)}>
                        Ver
                      </button>

                      <button
                        style={{ color: "red", marginLeft: "10px" }}
                        onClick={() => cancelarSolicitud(s.id)}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <h3>📂 Historial de reservas</h3>

      {reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Destino</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reservas.map((r) => (
              <tr key={r.idReserva}>
                <td>{r.fechaReserva}</td>

                <td>{r.destino}</td>

                <td>
                  {r.estado === "PENDIENTE" && "🟡 Pendiente"}
                  {r.estado === "APROBADA" && "🟢 Aprobado"}
                  {r.estado === "RECHAZADO" && "🔴 Rechazado"}
                </td>

                <td>
                  <button onClick={() => setDetalle(r)}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= MODAL SOLICITUD ================= */}
      {detalleSolicitud && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de solicitud</div>

            <div className="modal-body">
              <p>
                <b>Fecha:</b> {detalleSolicitud.fecha}
              </p>
              <p>
                <b>Destino:</b> {detalleSolicitud.destino}
              </p>
              <p>
                <b>Motivo:</b> {detalleSolicitud.motivo}
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setDetalleSolicitud(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESERVA ================= */}
      {detalle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de reserva</div>

            <div className="modal-body">
              <p>
                <b>Fecha:</b> {detalle.fechaReserva}
              </p>
              <p>
                <b>Destino:</b> {detalle.destino}
              </p>
              <p>
                <b>Observaciones:</b> {detalle.observaciones}
              </p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
