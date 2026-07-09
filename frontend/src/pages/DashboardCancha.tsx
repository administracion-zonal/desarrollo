import { useCallback, useEffect, useState } from "react";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";

const API = `/api/cancha`;

export default function DashboardCancha() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);

  const [mostrarQR, setMostrarQR] = useState(false);
  const [codigoQR, setCodigoQR] = useState("");
  const [mensajeQR, setMensajeQR] = useState<string | null>(null);

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
    if (!codigo) return;

    try {
      const res = await apiFetch(`${API}/validar?token=${codigo.trim()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const txt = await res.text();

      if (res.ok) {
        setMensajeQR("✅ " + txt);
        setMostrarQR(false);
        setCodigoQR("");
        actualizarTabla();
        // 🔥 recarga SIN await (evita conflicto de render)
      } else {
        setMensajeQR("❌ " + txt);
      }
    } catch {
      setMensajeQR("❌ Error de conexión");
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

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Panel de canchas</span>
        <h2>Reservas de cancha</h2>
      </div>

      <div className="table-actions">
        <button className="btn" onClick={() => setMostrarQR(true)}>
          Validar ingreso con QR
        </button>
      </div>

      {mostrarQR && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Validar QR</div>

            <p className="modal-lead">Escanee o pegue el código QR</p>

            <input
              autoFocus
              placeholder="Esperando escaneo..."
              value={codigoQR}
              onChange={(e) => {
                setCodigoQR(e.target.value);
              }}
            />

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => validarQR(codigoQR)}
              >
                Validar
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setMostrarQR(false);
                  setCodigoQR("");
                  setMensajeQR(null);
                }}
              >
                Cancelar
              </button>
            </div>

            {mensajeQR && <p className="hint">{mensajeQR}</p>}
          </div>
        </div>
      )}

      <table className="reservas-table">
        <thead>
          <tr>
            <th>Cédula</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Estado</th>
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
                        : r.estado === "NO_ASISTIO"
                          ? "status-pill--danger"
                          : "status-pill--pending"
                    }`}
                  >
                    {r.estado === "RESERVADO" && "Pendiente"}
                    {r.estado === "ASISTIO" && "Asistio"}
                    {r.estado === "NO_ASISTIO" && "No asistio"}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
