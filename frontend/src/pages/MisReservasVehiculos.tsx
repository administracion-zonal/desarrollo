import { useEffect, useState } from "react";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import type { VehiculoReserva } from "../types/VehiculoReserva";
import { apiFetch } from "../utils/api";

export default function MisReservasVehiculos() {
  const [reservas, setReservas] = useState<VehiculoReserva[]>([]);
  const [detalle, setDetalle] = useState<VehiculoReserva | null>(null);
  const [tab, setTab] = useState<"solicitudes" | "reservas">("solicitudes");
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
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">
          Movilidad institucional
        </span>
        <h2>Mis solicitudes y reservas de vehiculos</h2>
      </div>

      <div className="tabs-container">
        <button
          className={`tab ${tab === "solicitudes" ? "active" : ""}`}
          onClick={() => setTab("solicitudes")}
        >
          📝 Solicitudes
          <span className="badge">{solicitudes.length}</span>
        </button>

        <button
          className={`tab ${tab === "reservas" ? "active" : ""}`}
          onClick={() => setTab("reservas")}
        >
          🚗 Reservas
          <span className="badge">{reservas.length}</span>
        </button>
      </div>

      {/* ================= SOLICITUDES ================= */}

      {/* ================= TAB SOLICITUDES ================= */}

      <div className="tab-content">
        {tab === "solicitudes" && (
          <>
            <h3>📝 Solicitudes enviadas</h3>

            {solicitudes.length === 0 && <p>No tienes solicitudes</p>}

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
                          className="btn-danger-inline"
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

        {/* ================= TAB RESERVAS ================= */}
        {tab === "reservas" && (
          <>
            <h3>📂 Historial de reservas</h3>

            {reservas.length === 0 && <p>No tienes reservas</p>}

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
                        <span
                          className={`status-pill ${
                            r.estado === "APROBADA"
                              ? "status-pill--success"
                              : r.estado === "RECHAZADO"
                                ? "status-pill--danger"
                                : "status-pill--pending"
                          }`}
                        >
                          {r.estado}
                        </span>
                      </td>

                      <td>
                        <button onClick={() => setDetalle(r)}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      {/* ================= MODAL SOLICITUD ================= */}
      {detalleSolicitud && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de solicitud</div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Fecha</span>
                <strong>{detalleSolicitud.fecha}</strong>
              </div>
              <div className="detail-item">
                <span>Horario</span>
                <strong>
                  {detalleSolicitud.horaInicio} - {detalleSolicitud.horaFin}
                </strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Motivo</span>
                <strong>{detalleSolicitud.motivo || "Sin motivo"}</strong>
              </div>
              <div className="detail-item">
                <span>Origen</span>
                <strong>{detalleSolicitud.origen || "No registrado"}</strong>
              </div>
              <div className="detail-item">
                <span>Destino</span>
                <strong>{detalleSolicitud.destino || "No registrado"}</strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Servidores / acompanantes</span>
                <strong>
                  {detalleSolicitud.servidores || "No registrado"}
                </strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Observaciones</span>
                <strong>
                  {detalleSolicitud.observaciones || "Sin observaciones"}
                </strong>
              </div>
              {detalleSolicitud.observacionRechazo && (
                <div className="detail-item detail-item--full">
                  <span>Observacion de rechazo</span>
                  <strong>{detalleSolicitud.observacionRechazo}</strong>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDetalleSolicitud(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESERVA ================= */}
      {detalle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de reserva</div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Fecha</span>
                <strong>{detalle.fechaReserva}</strong>
              </div>
              <div className="detail-item">
                <span>Horario</span>
                <strong>
                  {detalle.horaInicio} - {detalle.horaFin}
                </strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Destino</span>
                <strong>{detalle.destino}</strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Detalle del recorrido</span>
                <strong>{detalle.observaciones || "Sin observaciones"}</strong>
              </div>
              <div className="detail-item">
                <span>Chofer asignado</span>
                <strong>{detalle.nombreChofer}</strong>
              </div>
              <div className="detail-item">
                <span>Vehiculo</span>
                <strong>{`${detalle.marcaVehiculo} ${detalle.modeloVehiculo}`}</strong>
              </div>
              <div className="detail-item">
                <span>Placa</span>
                <strong>{detalle.placaVehiculo}</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
