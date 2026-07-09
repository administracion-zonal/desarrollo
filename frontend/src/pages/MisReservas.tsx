import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import { useMisReservas } from "../hooks/useMisReservas";
import type { ReservaUsuario } from "../types/ReservaUsuario";
import { apiFetch } from "../utils/api";

export default function MisReservas() {
  const { reservas, setReservas, loading, error } = useMisReservas();

  const [detalle, setDetalle] = useState<ReservaUsuario | null>(null);

  const imprimirQR = () => {
    const canvas = document.querySelector("canvas");

    if (!canvas) return;

    const qrImage = canvas.toDataURL("image/png");

    const ventana = window.open("", "_blank", "width=400,height=600");

    if (!ventana) return;

    ventana.document.write(`
    <html>
      <head>
        <title>Reserva Coworking</title>
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

  const cancelarReserva = async (id: number) => {
    if (!confirm("¿Desea cancelar esta reserva?")) return;

    const token = localStorage.getItem("token");

    const res = await apiFetch(`/api/reservas/${id}/cancelar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    setReservas((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <p>Cargando reservas...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Coworking</span>
        <h2>Mis reservas</h2>
      </div>

      {reservas.length === 0 && <p>No tienes reservas registradas</p>}

      {reservas.length > 0 && (
        <table className="reservas-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Área</th>
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
                <td>{r.nombreArea}</td>
                <td>
                  <div className="table-actions">
                    <button onClick={() => setDetalle(r)}>Ver</button>

                    {r.puedeCancelar && (
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

            <div className="field">
              <div className="grid-2">
                <div>
                  <label>Fecha: </label>
                  <input value={detalle.fecha} readOnly />
                </div>
                <div>
                  <label>Horario: </label>
                  <input
                    value={`${detalle.horaInicio} - ${detalle.horaFin}`}
                    readOnly
                  />
                </div>
                <div>
                  <label>Área: </label>
                  <input value={detalle.nombreArea} readOnly />
                </div>
                <div>
                  <label>Institución: </label>
                  <input value={detalle.nombreInstitucion} readOnly />
                </div>
              </div>
              <label>Codigo QR: </label>
              <center>
                {detalle.vigente && detalle.qrToken && (
                  <QRCodeCanvas value={detalle.qrToken!} size={150} />
                )}
              </center>
            </div>

            <div className="modal-footer">
              {detalle.vigente && detalle.qrToken && (
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
