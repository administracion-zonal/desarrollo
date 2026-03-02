import { useEffect, useState } from "react";
import type { ReservaAdmin as Reserva } from "../types/ReservaAdmin";
import { useMemo } from "react";
import { formatearFecha } from "../utils/validaciones";

const API_RESERVAS = "http://localhost:8083/api/admin/reservas/todas";
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
      await fetch(`http://localhost:8083/api/admin/reservas/${id}/asistir`, {
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
      const res = await fetch(
        `http://localhost:8083/api/admin/reservas/validar-qr/${codigoQR}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
    const fin = new Date(`${reserva.fecha}T${reserva.horaFin}`);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaReserva = new Date(`${reserva.fecha}T00:00:00`);

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

    fetch(API_RESERVAS, {
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
          const fa = new Date(`${a.fecha}T${a.horaInicio}`).getTime();
          const fb = new Date(`${b.fecha}T${b.horaInicio}`).getTime();
          return fb - fa; // más recientes primero
        });

        setReservas(ordenadas);
      })
      .catch(() => setError("No se pudieron cargar las reservas"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <h2>📊 Dashboard de Reservas</h2>

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
                        <span style={{ color: "#00e676", fontWeight: "bold" }}>
                          ✅ Validada correctamente
                        </span>
                      );
                    }

                    if (estado === "ASISTIDA_FINALIZADA") {
                      return (
                        <span style={{ color: "#2196f3", fontWeight: "bold" }}>
                          ✔ Asistida y finalizada
                        </span>
                      );
                    }

                    if (estado === "NO_ASISTIO") {
                      return (
                        <span style={{ color: "#ff5252", fontWeight: "bold" }}>
                          ❌ No asistió
                        </span>
                      );
                    }

                    if (estado === "FUTURA") {
                      return (
                        <span style={{ color: "#ff9800", fontWeight: "bold" }}>
                          🕓 Se validará el día indicado
                        </span>
                      );
                    }

                    if (estado === "DISPONIBLE_VALIDAR") {
                      return (
                        <>
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
                        </>
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
            <h3>Detalle de reserva</h3>

            <p>
              <b>Cédula:</b> {detalle.cedula}
            </p>
            <p>
              <b>Nombre:</b> {detalle.nombres}
            </p>
            <p>
              <b>Área:</b> {detalle.nombreArea}
            </p>
            <p>
              <b>Institución:</b> {detalle.nombreInstitucion}
            </p>
            <p>
              <b>Fecha:</b> {detalle.fecha}
            </p>
            <p>
              <b>Horario:</b> {detalle.horaInicio} - {detalle.horaFin}
            </p>
            <p>
              <b>Tipo:</b> {detalle.tipoUsuario}
            </p>

            <button onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {mostrarQR && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Validar QR</h3>

            <p>
              Reserva de: <b>{reservaQR?.nombres}</b>
            </p>

            <input
              placeholder="Escanee o pegue el código QR"
              value={codigoQR}
              onChange={(e) => setCodigoQR(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            />

            <br />
            <br />

            <button onClick={validarQR}>Validar</button>

            <button onClick={() => setMostrarQR(false)}>Cancelar</button>

            {mensajeQR && (
              <p style={{ marginTop: "10px", fontWeight: 600 }}>{mensajeQR}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
