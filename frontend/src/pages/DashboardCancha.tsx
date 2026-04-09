import { useCallback, useEffect, useState } from "react";
import "../App.css";
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
    <>
      <h2>⚽ Reservas de Cancha (ADMIN)</h2>

      <button className="btn" onClick={() => setMostrarQR(true)}>
        📷 Validar ingreso con QR
      </button>

      {mostrarQR && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Validar QR</h3>

            <p>Escanee o pegue el código QR</p>

            <input
              autoFocus
              placeholder="Esperando escaneo..."
              value={codigoQR}
              onChange={(e) => {
                setCodigoQR(e.target.value);
              }}
            />

            <br />
            <br />

            <button className="btn" onClick={() => validarQR(codigoQR)}>
              Validar
            </button>

            <button
              className="btn"
              onClick={() => {
                setMostrarQR(false);
                setCodigoQR("");
                setMensajeQR(null);
              }}
            >
              Cancelar
            </button>

            {mensajeQR && (
              <p style={{ marginTop: "10px", fontWeight: 600 }}>{mensajeQR}</p>
            )}
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
                  {r.estado === "RESERVADO" && "🟡 Pendiente"}
                  {r.estado === "ASISTIO" && "🟢 Asistió"}
                  {r.estado === "NO_ASISTIO" && "🔴 No asistió"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}
