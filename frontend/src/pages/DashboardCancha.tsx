import { useCallback, useEffect, useState } from "react";
import ActionIconButton from "../components/ActionIconButton";
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
    <section className="page-shell">
      <div className="page-toolbar">
        <h2 className="page-title">Administrar canchas</h2>
        <ActionIconButton
          icon="📷"
          label="Validar ingreso con QR"
          variant="primary"
          onClick={() => setMostrarQR(true)}
        />
      </div>

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

            <div className="actions-inline">
              <ActionIconButton
                icon="✓"
                label="Validar QR"
                variant="success"
                onClick={() => validarQR(codigoQR)}
              />

              <ActionIconButton
                icon="✕"
                label="Cancelar"
                variant="danger"
                onClick={() => {
                  setMostrarQR(false);
                  setCodigoQR("");
                  setMensajeQR(null);
                }}
              />
            </div>

            {mensajeQR && (
              <p style={{ marginTop: "10px", fontWeight: 600 }}>{mensajeQR}</p>
            )}
          </div>
        </div>
      )}

      <div className="section-panel table-wrap">
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
                    {r.estado === "RESERVADO" && (
                      <span className="status-chip">
                        <span className="status-dot is-warning" /> Pendiente
                      </span>
                    )}
                    {r.estado === "ASISTIO" && (
                      <span className="status-chip">
                        <span className="status-dot is-success" /> Asistió
                      </span>
                    )}
                    {r.estado === "NO_ASISTIO" && (
                      <span className="status-chip">
                        <span className="status-dot is-danger" /> No asistió
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
