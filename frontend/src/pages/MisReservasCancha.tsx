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
    <>
      <h2>⚽ Mis Reservas de Cancha</h2>

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
                  {r.estado === "RESERVADO" && "🟡 Pendiente"}
                  {r.estado === "ASISTIO" && "🟢 Asistió"}
                  {r.estado === "NO_ASISTIO" && "🔴 No asistió"}
                </td>

                {/* ✅ ACCIONES */}

                <td>
                  <button onClick={() => setDetalle(r)}>Ver</button>

                  {r.estado === "RESERVADO" && (
                    <button
                      style={{ color: "red", marginLeft: "10px" }}
                      onClick={() => cancelarReserva(r.id)}
                    >
                      Cancelar
                    </button>
                  )}
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

            <div className="modal-body">
              <p>
                <b>Fecha:</b> {detalle.fecha}
              </p>
              <p>
                <b>Horario:</b> {detalle.horaInicio} - {detalle.horaFin}
              </p>
              <p>
                {detalle.estado === "RESERVADO" && detalle.qrToken && (
                  <b>QR:</b>
                )}
              </p>
              <p>
                {detalle.estado === "RESERVADO" && detalle.qrToken && (
                  <QRCodeCanvas value={detalle.qrToken} size={200} />
                )}
              </p>
            </div>

            <div className="modal-footer">
              {detalle.estado === "RESERVADO" && detalle.qrToken && (
                <button className="btn" onClick={imprimirQR}>
                  🖨 Imprimir QR
                </button>
              )}
              <button onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
