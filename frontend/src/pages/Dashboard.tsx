import { useEffect, useMemo, useState } from "react";
import type { ReservaAdmin as Reserva } from "../types/ReservaAdmin";
import { apiFetch } from "../utils/api";
import { formatearFecha } from "../utils/validaciones";

const API_RESERVAS = `/api/reservas/todas`;
export default function Dashboard() {
  const token = localStorage.getItem("token");

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(
    token ? null : "No autenticado",
  );

  const [mostrarQR, setMostrarQR] = useState(false);
  const [reservaQR, setReservaQR] = useState<Reserva | null>(null);
  const [codigoQR, setCodigoQR] = useState("");
  const [mensajeQR, setMensajeQR] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");

  const marcarAsistencia = async (id: number) => {
    try {
      await apiFetch(`/reservas/${id}/asistir`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // refrescar lista
      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, asistio: true } : r)),
      );
    } catch {
      alert("Llegó tarde, reserva perdida");
    }
  };

  const validarQR = async () => {
    if (!codigoQR || !reservaQR) return;

    try {
      const res = await apiFetch(`/reservas/validar-qr/${codigoQR}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const txt = await res.text();

      if (res.ok) {
        setMensajeQR("✅ Reserva validada");
        marcarAsistencia(reservaQR.id);
        setTimeout(() => {
          setMostrarQR(false);
          setCodigoQR("");
          setMensajeQR(null);
        }, 1500);
      } else {
        setMensajeQR("❌ " + txt);
      }
    } catch {
      setMensajeQR("Error de conexión");
    }
  };

  const [detalle, setDetalle] = useState<Reserva | null>(null);

  const obtenerEstadoReserva = (reserva: Reserva) => {
    const ahora = new Date();
    const [anio, mes, dia] = reserva.fecha.split("-").map(Number);
    const fechaReserva = new Date(anio, mes - 1, dia);

    const fin = new Date(
      anio,
      mes - 1,
      dia,
      Number(reserva.horaFin.split(":")[0]),
      Number(reserva.horaFin.split(":")[1]),
    );
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    /* PASO 1 — ASISTIÓ */
    if (reserva.usado && reserva.asistio) {
      if (ahora > fin) return "ASISTIDA_FINALIZADA";

      return "VALIDADA";
    }

    /* PASO 2 — FUTURA */
    if (fechaReserva > hoy) {
      return "FUTURA";
    }

    /* PASO 3 — PASADA */
    if (fechaReserva < hoy) {
      return "NO_ASISTIO";
    }

    /* PASO 4 — HOY PERO NO INICIA */
    // SI YA TERMINÓ
    if (ahora > fin) {
      return "NO_ASISTIO";
    }

    // SI ES HOY (SIN IMPORTAR SI YA INICIÓ O NO)
    return "DISPONIBLE_VALIDAR";
  };

  const reservasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return reservas;

    const texto = busqueda.toLowerCase();

    return reservas.filter(
      (r) =>
        r.cedula.toLowerCase().includes(texto) ||
        r.nombres.toLowerCase().includes(texto) ||
        r.qrToken?.toLowerCase().includes(texto),
    );
  }, [busqueda, reservas]);

  useEffect(() => {
    if (!token) return;
    console.log("TOKEN 👉", token);
    apiFetch(API_RESERVAS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        const ordenadas = data.sort((a: Reserva, b: Reserva) => {
          const fa = `${a.fecha} ${a.horaInicio}`;
          const fb = `${b.fecha} ${b.horaInicio}`;

          if (fa > fb) return -1;
          if (fa < fb) return 1;
          return 0;
        });

        setReservas(ordenadas);
      })

      .catch(() => setError("No se pudieron cargar las reservas"))

      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Panel administrativo</span>
        <h2>Dashboard de reservas</h2>
      </div>

      {loading && <p>Cargando reservas...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && reservas.length === 0 && (
        <p>No existen reservas registradas</p>
      )}

      {!loading && reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>
                Cédula
                <br />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="table-input"
                />
              </th>
              <th>Nombres</th>

              <th>Fecha</th>
              <th>Hora Inicio</th>
              <th>Hora Fin</th>

              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {reservasFiltradas.map((reserva) => (
              <tr key={reserva.id}>
                <td>{reserva.cedula}</td>
                <td>{reserva.nombres}</td>

                <td>{formatearFecha(reserva.fecha)}</td>
                <td>{reserva.horaInicio}</td>
                <td>{reserva.horaFin}</td>

                <td>
                  {(() => {
                    const estado = obtenerEstadoReserva(reserva);

                    if (estado === "VALIDADA") {
                      return (
                        <span className="status-pill status-pill--success">
                          Validada correctamente
                        </span>
                      );
                    }

                    if (estado === "ASISTIDA_FINALIZADA") {
                      return (
                        <span className="status-pill status-pill--info">
                          Asistida y finalizada
                        </span>
                      );
                    }

                    if (estado === "NO_ASISTIO") {
                      return (
                        <span className="status-pill status-pill--danger">
                          No asistio
                        </span>
                      );
                    }

                    if (estado === "FUTURA") {
                      return (
                        <span className="status-pill status-pill--pending">
                          Se validara el dia indicado
                        </span>
                      );
                    }

                    if (estado === "DISPONIBLE_VALIDAR") {
                      return (
                        <div className="table-actions">
                          <button
                            onClick={() => {
                              setReservaQR(reserva);
                              setMostrarQR(true);
                            }}
                          >
                            Validar QR
                          </button>

                          <button onClick={() => setDetalle(reserva)}>
                            Ver
                          </button>
                        </div>
                      );
                    }
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detalle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de reserva</div>

            <div className="detail-grid">
              <div className="detail-item">
                <span>Cedula</span>
                <strong>{detalle.cedula}</strong>
              </div>
              <div className="detail-item">
                <span>Nombre</span>
                <strong>{detalle.nombres}</strong>
              </div>
              <div className="detail-item">
                <span>Area</span>
                <strong>{detalle.nombreArea}</strong>
              </div>
              <div className="detail-item">
                <span>Institucion</span>
                <strong>{detalle.nombreInstitucion}</strong>
              </div>
              <div className="detail-item">
                <span>Fecha</span>
                <strong>{detalle.fecha}</strong>
              </div>
              <div className="detail-item">
                <span>Horario</span>
                <strong>
                  {detalle.horaInicio} - {detalle.horaFin}
                </strong>
              </div>
              <div className="detail-item detail-item--full">
                <span>Tipo de usuario</span>
                <strong>{detalle.tipoUsuario}</strong>
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

      {mostrarQR && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Validar QR</div>

            <p className="modal-lead">
              Reserva de <strong>{reservaQR?.nombres}</strong>
            </p>

            <input
              placeholder="Escanee o pegue el código QR"
              value={codigoQR}
              onChange={(e) => setCodigoQR(e.target.value)}
            />

            <div className="modal-footer">
              <button className="btn-primary" onClick={validarQR}>
                Validar
              </button>

              <button
                className="btn-secondary"
                onClick={() => setMostrarQR(false)}
              >
                Cancelar
              </button>
            </div>

            {mensajeQR && <p className="hint">{mensajeQR}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
