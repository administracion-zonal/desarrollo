import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";

const API = `/api/cancha/mis`;

export default function MisReservasCancha() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);

  const [detalle, setDetalle] = useState<ReservaCancha | null>(null);

  const cancelarReserva = async (id: number) => {
    const token = localStorage.getItem("token");

    if (!confirm("¿Seguro que deseas cancelar la reserva?")) return;

    try {
      const res = await apiFetch(`/api/cancha/${id}/cancelar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cancelar");
      }

      // 🔥 ACTUALIZAR UI SIN RECARGAR
      setReservas((prev) => prev.filter((r) => r.id !== id));

      // cerrar modal si estaba abierto
      if (detalle?.id === id) {
        setDetalle(null);
      }
    } catch (err) {
      console.error(err);
      alert("Error al cancelar la reserva");
    }
  };

  const imprimirQR = () => {
    const canvas = document.querySelector("canvas");

    if (!canvas) return;

    const qrImage = canvas.toDataURL("image/png");

    const ventana = window.open("", "_blank", "width=400,height=600");

    if (!ventana) return;

    ventana.document.write(`
    <html>
      <head>
        <title>Reserva Cancha</title>
        <style>
          body{
            font-family: Arial;
            text-align:center;
            padding:30px;
          }
          img{
            width:220px;
            margin-top:10px;
          }
        </style>
      </head>
      <body>

        <h3>Tu código de acceso</h3>

        <p>
        Administración Zonal Valle de los Chillos
        </p>

        <img src="${qrImage}" />

      </body>
    </html>
  `);

    ventana.document.close();

    ventana.focus();

    setTimeout(() => {
      ventana.print();
    }, 500);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    apiFetch(API, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("No autorizado");
        }
        return res.json();
      })
      .then(setReservas);
  }, []);

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Canchas</span>
        <h2>Mis reservas de cancha</h2>
      </div>

      {reservas.length === 0 && <p>No tienes reservas registradas</p>}

      {reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reservas.map((r) => (
              <tr key={r.id}>
                <td>{r.fecha}</td>

                <td>
                  {r.horaInicio} - {r.horaFin}
                </td>

                {/* ✅ ESTADO VISUAL */}
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

                {/* ✅ ACCIONES */}

                <td>
                  <div className="table-actions">
                    <button onClick={() => setDetalle(r)}>Ver</button>

                    {r.estado === "RESERVADO" && (
                      <button
                        className="btn-danger-inline"
                        onClick={() => cancelarReserva(r.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Detalle de reserva</div>

            <div className="detail-grid">
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
                <span>Estado</span>
                <strong>{detalle.estado}</strong>
              </div>
              {detalle.estado === "RESERVADO" && detalle.qrToken && (
                <div
                  className="detail-item detail-item--full"
                  style={{ justifyItems: "center" }}
                >
                  <span>Codigo QR</span>
                  <QRCodeCanvas value={detalle.qrToken} size={180} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {detalle.estado === "RESERVADO" && detalle.qrToken && (
                <button className="btn" onClick={imprimirQR}>
                  Imprimir QR
                </button>
              )}
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
