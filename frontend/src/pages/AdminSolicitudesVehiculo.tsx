import { useEffect, useState } from "react";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { apiFetch } from "../utils/api";

type Chofer = {
  idUsuario: number;
  nombres: string;
};

export default function AdminSolicitudesVehiculo() {
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudVehiculo | null>(null);

  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [choferSeleccionado, setChoferSeleccionado] = useState<number | null>(
    null,
  );
  const [detalleSolicitud, setDetalleSolicitud] =
    useState<SolicitudVehiculo | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [aprobando, setAprobando] = useState(false);

  const abrirModal = (solicitud: SolicitudVehiculo) => {
    setDetalleSolicitud(null);
    setSolicitudSeleccionada(solicitud);
    setModalOpen(true);
  };

  const confirmarAprobacion = async () => {
    if (!solicitudSeleccionada || choferSeleccionado === null) {
      alert("Seleccione un chofer");
      return;
    }

    try {
      setAprobando(true);
      await solicitudVehiculoService.aprobar(
        solicitudSeleccionada.id,
        choferSeleccionado,
      );

      setModalOpen(false);
      setChoferSeleccionado(null);
      setSolicitudSeleccionada(null);

      await cargar();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error al aprobar la solicitud");
      }
    } finally {
      setAprobando(false);
    }
  };

  const cargar = async () => {
    try {
      const data = await solicitudVehiculoService.listarPendientes();
      setSolicitudes(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error desconocido");
      }
    }
  };

  // 🔥 CARGAR CHOFERES
  useEffect(() => {
    apiFetch("/api/vehiculos/choferes")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error("Error backend: " + text);
        }
        return res.json();
      })
      .then((data) => setChoferes(data))
      .catch((err) => {
        console.error("ERROR REAL:", err);
        setError(err.message);
      });
  }, []);

  // 🔥 CARGAR SOLICITUDES
  useEffect(() => {
    cargar();
  }, []);

  const rechazar = async (id: number) => {
    try {
      await solicitudVehiculoService.rechazar(id, motivoRechazo);
      setMotivoRechazo("");
      setDetalleSolicitud(null);
      await cargar();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error desconocido");
      }
    }
  };

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">
          Administracion vehicular
        </span>
        <h2>Solicitudes pendientes</h2>
      </div>

      {error && <p className="error">{error}</p>}

      {solicitudes.length === 0 && <p>No hay solicitudes pendientes</p>}

      {solicitudes.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Ruta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.nombres}</strong>
                  <br />
                  {s.cedula}
                </td>
                <td>{s.fecha}</td>
                <td>
                  {s.horaInicio} - {s.horaFin}
                </td>
                <td>
                  <strong>{s.origen || "Sin origen"}</strong>
                  <br />
                  {s.destino}
                </td>
                <td>
                  <span className="status-pill status-pill--pending">
                    {s.estado}
                  </span>
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      className="btn"
                      onClick={() => setDetalleSolicitud(s)}
                    >
                      Ver detalle
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => abrirModal(s)}
                    >
                      Aprobar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Asignar chofer y aprobar</div>

            <div className="field">
              <p className="modal-lead">
                Solicitud de {solicitudSeleccionada?.nombres} para el trayecto{" "}
                {solicitudSeleccionada?.origen || "sin origen"} hacia{" "}
                {solicitudSeleccionada?.destino}.
              </p>

              <label>Asignar Chofer</label>
              <select
                className="select-chofer"
                value={choferSeleccionado ?? ""}
                onChange={(e) =>
                  setChoferSeleccionado(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Seleccione un chofer</option>

                {choferes.map((c) => (
                  <option key={c.idUsuario} value={c.idUsuario}>
                    {c.nombres}
                  </option>
                ))}
              </select>

              <div className="modal-footer">
                <button className="btn-primary" onClick={confirmarAprobacion}>
                  {aprobando ? "Aprobando..." : "Confirmar aprobacion"}
                </button>
                <button
                  className="btn-secondary"
                  disabled={aprobando}
                  onClick={() => {
                    setModalOpen(false);
                    setChoferSeleccionado(null);
                    setSolicitudSeleccionada(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detalleSolicitud && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de solicitud</div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Solicitante</span>
                <strong>{detalleSolicitud.nombres}</strong>
              </div>
              <div className="detail-item">
                <span>Cedula</span>
                <strong>{detalleSolicitud.cedula}</strong>
              </div>
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
                <strong>
                  {detalleSolicitud.motivo || "Sin motivo registrado"}
                </strong>
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
            </div>

            <div className="field modal-stack">
              <label>Observacion de rechazo</label>
              <textarea
                value={motivoRechazo}
                placeholder="Explique al usuario por que se rechaza la solicitud"
                onChange={(e) => setMotivoRechazo(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-warning"
                onClick={() => rechazar(detalleSolicitud.id)}
              >
                Rechazar solicitud
              </button>
              <button
                className="btn"
                onClick={() => abrirModal(detalleSolicitud)}
              >
                Aprobar
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setDetalleSolicitud(null);
                  setMotivoRechazo("");
                }}
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
