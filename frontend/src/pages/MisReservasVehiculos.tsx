import { useEffect, useState } from "react";
import ActionIconButton from "../components/ActionIconButton";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import "../styles/misReservasVehiculos.css";
import type { VehiculoReserva } from "../types/VehiculoReserva";
import { apiFetch } from "../utils/api";

export default function MisReservasVehiculos() {
  const [reservas, setReservas] = useState<VehiculoReserva[]>([]);
  const [detalle, setDetalle] = useState<VehiculoReserva | null>(null);
  const [tab, setTab] = useState<"solicitudes" | "reservas">("solicitudes");
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculo[]>([]);
  const [detalleSolicitud, setDetalleSolicitud] =
    useState<SolicitudVehiculo | null>(null);

  const estadoEtiqueta = (estado?: string) => {
    if (!estado) return "PENDIENTE";
    return estado;
  };

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
    <section className="reservation-shell">
      <h2 className="page-title">Mis reservas de vehículos</h2>

      <div className="tabs-shell">
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
            <div className="reservation-table-panel">
              <h3 className="tab-panel-title">Solicitudes enviadas</h3>

              {solicitudes.length === 0 && <p>No tienes solicitudes</p>}

              {solicitudes.length > 0 && (
                <div className="table-wrap">
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
                            <div className="actions-inline">
                              <ActionIconButton
                                onClick={() => setDetalleSolicitud(s)}
                                icon="👁"
                                label="Ver detalle"
                              />

                              <ActionIconButton
                                onClick={() => cancelarSolicitud(s.id)}
                                icon="✕"
                                label="Cancelar solicitud"
                                variant="danger"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB RESERVAS ================= */}
          {tab === "reservas" && (
            <div className="reservation-table-panel">
              <h3 className="tab-panel-title">Historial de reservas</h3>

              {reservas.length === 0 && <p>No tienes reservas</p>}

              {reservas.length > 0 && (
                <div className="table-wrap">
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
                            <ActionIconButton
                              onClick={() => setDetalle(r)}
                              icon="👁"
                              label="Ver detalle"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* ================= MODAL SOLICITUD ================= */}
      {detalleSolicitud && (
        <div className="modal-overlay">
          <div className="modal vehicle-modal vehicle-modal--solicitud">
            <div className="modal-header vehicle-modal__header">
              <div>
                <h3>Detalle de solicitud</h3>
                <small>Solicitud #{detalleSolicitud.id}</small>
              </div>
              <span
                className={`status-chip status-${estadoEtiqueta(detalleSolicitud.estado).toLowerCase()}`}
              >
                {estadoEtiqueta(detalleSolicitud.estado)}
              </span>
            </div>

            <div className="vehicle-modal__body">
              <div className="vehicle-grid">
                <div className="vehicle-card">
                  <h4>Plan de viaje</h4>
                  <p>
                    <b>Fecha:</b> {detalleSolicitud.fecha}
                  </p>
                  <p>
                    <b>Horario:</b> {detalleSolicitud.horaInicio} -{" "}
                    {detalleSolicitud.horaFin}
                  </p>
                  <p>
                    <b>Origen:</b> {detalleSolicitud.origen || "No registrado"}
                  </p>
                  <p>
                    <b>Destino:</b> {detalleSolicitud.destino}
                  </p>
                </div>

                <div className="vehicle-card">
                  <h4>Justificación</h4>
                  <p>
                    <b>Motivo:</b> {detalleSolicitud.motivo}
                  </p>
                  <p>
                    <b>Observaciones:</b>{" "}
                    {detalleSolicitud.observaciones || "Sin observaciones"}
                  </p>
                  <p>
                    <b>Servidores:</b>{" "}
                    {detalleSolicitud.servidores || "No registrado"}
                  </p>
                </div>

                {detalleSolicitud.observacionRechazo && (
                  <div className="vehicle-card vehicle-card--warning">
                    <h4>Motivo de rechazo</h4>
                    <p>{detalleSolicitud.observacionRechazo}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <ActionIconButton
                onClick={() => setDetalleSolicitud(null)}
                icon="✕"
                label="Cerrar"
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL RESERVA ================= */}
      {detalle && (
        <div className="modal-overlay">
          <div className="modal vehicle-modal">
            <div className="modal-header vehicle-modal__header">
              <div>
                <h3>Detalle de reserva</h3>
                <small>Reserva #{detalle.idReserva}</small>
              </div>
              <span
                className={`status-chip status-${estadoEtiqueta(detalle.estado).toLowerCase()}`}
              >
                {estadoEtiqueta(detalle.estado)}
              </span>
            </div>

            <div className="vehicle-modal__body">
              <div className="vehicle-grid">
                <div className="vehicle-card">
                  <h4>Trayecto</h4>
                  <p>
                    <b>Fecha:</b> {detalle.fechaReserva}
                  </p>
                  <p>
                    <b>Horario:</b> {detalle.horaInicio} - {detalle.horaFin}
                  </p>
                  <p>
                    <b>Destino:</b> {detalle.destino}
                  </p>
                  <p>
                    <b>Solicitud origen:</b>{" "}
                    {detalle.idSolicitud ?? "No aplica"}
                  </p>
                </div>

                <div className="vehicle-card">
                  <h4>Asignación</h4>
                  <p>
                    <b>Chofer:</b> {detalle.nombreChofer || "Sin asignar"}
                  </p>
                  <p>
                    <b>Vehículo:</b>{" "}
                    {`${detalle.marcaVehiculo} ${detalle.modeloVehiculo}`}
                  </p>
                  <p>
                    <b>Placa:</b> {detalle.placaVehiculo}
                  </p>
                  <p>
                    <b>Observaciones:</b>{" "}
                    {detalle.observaciones || "Sin observaciones"}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <ActionIconButton
                onClick={() => setDetalle(null)}
                icon="✕"
                label="Cerrar"
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
