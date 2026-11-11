import { useCallback, useEffect, useState } from "react";
import ModalPortal from "../components/ModalPortal";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";

const API = `/api/cancha`;

type SolicitudDesbloqueo = {
  id: number;
  cedula: string;
  nombres: string;
  fechaSolicitud: string;
};

export default function DashboardCancha() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudDesbloqueo[]>([]);
  const [observaciones, setObservaciones] = useState<Record<number, string>>({});
  const [errorDesbloqueo, setErrorDesbloqueo] = useState<string | null>(null);

  const [mostrarQR, setMostrarQR] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [mensajeQR, setMensajeQR] = useState<string | null>(null);
  const [validandoQR, setValidandoQR] = useState(false);
  const [reservaValidada, setReservaValidada] = useState<ReservaCancha | null>(
    null,
  );
  const [detalleReserva, setDetalleReserva] = useState<ReservaCancha | null>(
    null,
  );

  const token = localStorage.getItem("token");

  /* ================= CARGAR ================= */
  const cargar = useCallback(() => {
    apiFetch(`${API}/todas`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())

      .then((data) => {
        if (Array.isArray(data)) {
          setReservas(data);
        } else {
          console.error("Respuesta inesperada:", data);
          setReservas([]);
        }
      })

      .catch(() => setReservas([]));
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* ================= VALIDAR QR ================= */
  const validarQR = async (codigo: string) => {
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio || validandoQR) return;

    try {
      setValidandoQR(true);
      const params = new URLSearchParams({ token: codigoLimpio });
      const res = await apiFetch(`${API}/validar?${params.toString()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const reserva: ReservaCancha = await res.json();
      setReservaValidada(reserva);
      setMensajeQR("Ingreso validado correctamente");
      void actualizarTabla();
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "Error de conexión";
      try {
        const respuesta = JSON.parse(mensaje) as { message?: string; error?: string };
        setMensajeQR(`❌ ${respuesta.message ?? respuesta.error ?? mensaje}`);
      } catch {
        setMensajeQR(`❌ ${mensaje}`);
      }
    } finally {
      setValidandoQR(false);
    }
  };

  const actualizarTabla = async () => {
    try {
      const res = await apiFetch(`${API}/todas`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setReservas(data);
      } else {
        setReservas([]);
      }
    } catch {
      setReservas([]);
    }
  };

  const cargarSolicitudes = useCallback(async () => {
    try {
      const res = await apiFetch(`${API}/desbloqueo/pendientes`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: unknown = await res.json();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorDesbloqueo(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las solicitudes de desbloqueo",
      );
    }
  }, []);

  const resolverSolicitud = async (id: number, aprobar: boolean) => {
    const observacion = observaciones[id]?.trim() ?? "";
    if (!aprobar && !observacion) {
      setErrorDesbloqueo("Ingrese una observación para rechazar la solicitud");
      return;
    }

    try {
      const res = await apiFetch(`${API}/desbloqueo/${id}/resolver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobar, observacion }),
      });
      if (!res.ok) {
        setErrorDesbloqueo(await res.text());
        return;
      }
      setErrorDesbloqueo(null);
      setObservaciones((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await cargarSolicitudes();
    } catch {
      setErrorDesbloqueo("No se pudo resolver la solicitud");
    }
  };

  useEffect(() => {
    void cargarSolicitudes();
  }, [cargarSolicitudes]);

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Panel de canchas</span>
        <h2>Reservas de cancha</h2>
      </div>

      <div className="table-actions">
        <button
          className="btn"
          onClick={() => {
            setReservaValidada(null);
            setMensajeQR(null);
            setCodigoQR("");
            setMostrarQR(true);
          }}
        >
          Validar ingreso con QR
        </button>
      </div>

      <section className="form-panel">
        <h3>Solicitudes de desbloqueo</h3>
        {errorDesbloqueo && <p className="error">{errorDesbloqueo}</p>}
        {solicitudes.length === 0 ? (
          <p className="hint">No hay solicitudes pendientes.</p>
        ) : (
          <div className="table-responsive">
            <table className="reservas-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Fecha de solicitud</th>
                  <th>Observación (obligatoria para rechazar)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <td>{solicitud.nombres} ({solicitud.cedula})</td>
                    <td>{new Date(solicitud.fechaSolicitud).toLocaleString()}</td>
                    <td>
                      <input
                        value={observaciones[solicitud.id] ?? ""}
                        onChange={(event) =>
                          setObservaciones((current) => ({
                            ...current,
                            [solicitud.id]: event.target.value,
                          }))
                        }
                        aria-label={`Observación para ${solicitud.cedula}`}
                      />
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        onClick={() => resolverSolicitud(solicitud.id, true)}
                      >
                        Aprobar
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => resolverSolicitud(solicitud.id, false)}
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrarQR && (
        <ModalPortal>
          <div className="modal">
            <div className="modal-header">Validar QR</div>

            {reservaValidada ? (
              <>
                <p className="success-message" role="status">{mensajeQR}</p>
                <h3>Información de la reserva</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span>Usuario</span>
                    <strong>{reservaValidada.usuario?.nombres ?? "No disponible"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Cédula</span>
                    <strong>{reservaValidada.usuario?.cedula ?? "No disponible"}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Fecha</span>
                    <strong>{reservaValidada.fecha}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Horario</span>
                    <strong>{reservaValidada.horaInicio} - {reservaValidada.horaFin}</strong>
                  </div>
                  <div className="detail-item detail-item--full">
                    <span>Estado</span>
                    <strong>{reservaValidada.estado}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="modal-lead">Escanee o pegue el código QR</p>
                <input
                  autoFocus
                  placeholder="Esperando escaneo..."
                  value={codigoQR}
                  onChange={(e) => setCodigoQR(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void validarQR(codigoQR);
                    }
                  }}
                />
                {mensajeQR && <p className="error" role="alert">{mensajeQR}</p>}
              </>
            )}

            <div className="modal-footer">
              {reservaValidada && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    setReservaValidada(null);
                    setCodigoQR("");
                    setMensajeQR(null);
                  }}
                >
                  Validar otro QR
                </button>
              )}
              {!reservaValidada && (
                <button
                  className="btn-primary"
                  onClick={() => validarQR(codigoQR)}
                  disabled={validandoQR || !codigoQR.trim()}
                >
                  {validandoQR ? "Validando..." : "Validar"}
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => {
                  setMostrarQR(false);
                  setCodigoQR("");
                  setMensajeQR(null);
                  setReservaValidada(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      <div className="table-responsive">
      <table className="reservas-table">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(reservas) &&
            reservas.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.usuario && typeof r.usuario === "object"
                    ? r.usuario.cedula
                    : "-"}
                </td>

                <td>{r.fecha}</td>

                <td>
                  {r.horaInicio} - {r.horaFin}
                </td>

                <td>
                  <span
                    className={`status-pill ${
                      r.estado === "ASISTIO"
                        ? "status-pill--success"
                        : r.estado === "NO_ASISTIO" || r.estado === "CANCELADO"
                          ? "status-pill--danger"
                          : "status-pill--pending"
                    }`}
                  >
                    {r.estado === "RESERVADO" && "Pendiente"}
                    {r.estado === "ASISTIO" && "Asistio"}
                    {r.estado === "NO_ASISTIO" && "No asistio"}
                    {r.estado === "CANCELADO" && "Cancelado"}
                  </span>
                </td>
                <td>
                  <button
                    className="btn-secondary"
                    onClick={() => setDetalleReserva(r)}
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      </div>
      {detalleReserva && (
        <ModalPortal>
          <div className="modal modal--fullscreen">
            <div className="modal-header">Detalle de reserva de cancha</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span>Usuario</span>
                <strong>{detalleReserva.usuario?.nombres ?? "No disponible"}</strong>
              </div>
              <div className="detail-item">
                <span>Cédula</span>
                <strong>{detalleReserva.usuario?.cedula ?? "No disponible"}</strong>
              </div>
              <div className="detail-item">
                <span>Fecha</span>
                <strong>{detalleReserva.fecha}</strong>
              </div>
              <div className="detail-item">
                <span>Horario</span>
                <strong>{detalleReserva.horaInicio} - {detalleReserva.horaFin}</strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Estado</span>
                <strong>{detalleReserva.estado}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setDetalleReserva(null)}
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
