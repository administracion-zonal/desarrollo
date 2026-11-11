import { useEffect, useState } from "react";
import ModalPortal from "../components/ModalPortal";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { apiFetch } from "../utils/api";
import { fechaActualLocal } from "../utils/dateUtils";

type Chofer = {
  idUsuario: number;
  nombres: string;
};

type VehiculoFlota = {
  idVehiculo: number;
  marca: string;
  modelo: string;
  placa: string;
  estado: string | null;
};

const esSolicitudVencida = (solicitud: SolicitudVehiculo | null) =>
  solicitud !== null
  && (solicitud.estado === "NO_ASISTIO" || solicitud.fecha < fechaActualLocal());

export default function AdminSolicitudesVehiculo() {
  const [tab, setTab] = useState<"solicitudes" | "flota">("solicitudes");
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
  const [vehiculos, setVehiculos] = useState<VehiculoFlota[]>([]);

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
    if (esSolicitudVencida(solicitudSeleccionada)) {
      setError("No se puede aprobar una solicitud de una fecha pasada");
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

  const cargarFlota = async () => {
    try {
      const res = await apiFetch("/api/vehiculos");
      if (!res.ok) throw new Error(await res.text());
      setVehiculos(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la flota");
    }
  };

  const cambiarEstadoVehiculo = async (idVehiculo: number, estado: string) => {
    setError(null);
    try {
      const res = await apiFetch(`/api/vehiculos/admin/${idVehiculo}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error(await res.text());
      const vehiculoActualizado: VehiculoFlota = await res.json();
      setVehiculos((actuales) =>
        actuales.map((vehiculo) =>
          vehiculo.idVehiculo === idVehiculo ? vehiculoActualizado : vehiculo,
        ),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el vehículo");
      await cargarFlota();
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
    cargarFlota();
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

      <div className="tabs-container" role="tablist" aria-label="Administración vehicular">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "solicitudes"}
          className={`tab ${tab === "solicitudes" ? "active" : ""}`}
          onClick={() => setTab("solicitudes")}
        >
          Solicitudes
          <span className="badge">{solicitudes.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "flota"}
          className={`tab ${tab === "flota" ? "active" : ""}`}
          onClick={() => setTab("flota")}
        >
          Estado de la flota
          <span className="badge">{vehiculos.length}</span>
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {tab === "solicitudes" && (
        <div className="tab-content" role="tabpanel">
          <h3>Solicitudes pendientes de aprobación</h3>
          {solicitudes.length === 0 && <p>No hay solicitudes pendientes</p>}

          {solicitudes.length > 0 && (
            <div className="table-responsive">
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
            {solicitudes.map((s) => {
              const inasistida = esSolicitudVencida(s);
              return (
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
                    <span className={`status-pill ${inasistida ? "status-pill--danger" : "status-pill--pending"}`}>
                      {inasistida ? "NO_ASISTIO" : s.estado}
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
                        disabled={inasistida}
                        title={inasistida ? "No se puede aprobar una solicitud de una fecha pasada" : undefined}
                        onClick={() => abrirModal(s)}
                      >
                        Aprobar solicitud
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === "flota" && (
        <section className="flow-stack tab-content" role="tabpanel">
          <h3>Estado operativo de la flota</h3>
          <p>Un vehículo no operativo no puede asignarse a nuevas solicitudes.</p>
          {vehiculos.length === 0 && <p>No hay vehículos registrados.</p>}
          {vehiculos.length > 0 && (
            <div className="table-responsive">
            <table className="reservas-table">
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Placa</th>
                <th>Estado operativo</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo) => (
                <tr key={vehiculo.idVehiculo}>
                  <td>{vehiculo.marca} {vehiculo.modelo}</td>
                  <td>{vehiculo.placa}</td>
                  <td>
                    <select
                      value={vehiculo.estado ?? "DISPONIBLE"}
                      onChange={(e) =>
                        cambiarEstadoVehiculo(vehiculo.idVehiculo, e.target.value)
                      }
                    >
                      {!["DISPONIBLE", "MANTENIMIENTO", "FUERA_DE_SERVICIO", "BLOQUEADO"]
                        .includes(vehiculo.estado ?? "") && (
                        <option value={vehiculo.estado ?? ""} disabled>
                          {vehiculo.estado ?? "Sin estado"}
                        </option>
                      )}
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
                      <option value="BLOQUEADO">Bloqueado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <ModalPortal>
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
                <button
                  className="btn-primary"
                  disabled={aprobando || esSolicitudVencida(solicitudSeleccionada)}
                  onClick={confirmarAprobacion}
                >
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
        </ModalPortal>
      )}

      {detalleSolicitud && (
        <ModalPortal>
          <div className="modal modal--fullscreen">
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
                disabled={!motivoRechazo.trim()}
                onClick={() => rechazar(detalleSolicitud.id)}
              >
                Rechazar solicitud
              </button>
              <button
                className="btn"
                disabled={esSolicitudVencida(detalleSolicitud)}
                title={
                  esSolicitudVencida(detalleSolicitud)
                    ? "No se puede aprobar una solicitud de una fecha pasada"
                    : undefined
                }
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
        </ModalPortal>
      )}
    </div>
  );
}
