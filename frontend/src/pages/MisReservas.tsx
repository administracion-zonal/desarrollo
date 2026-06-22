import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import ActionIconButton from "../components/ActionIconButton";
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
    <section className="reservation-shell">
      <h2 className="page-title">Mis reservas de coworking</h2>

      {reservas.length === 0 && <p>No tienes reservas registradas</p>}

      {reservas.length > 0 && (
        <div className="reservation-table-panel table-wrap">
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
                    <div className="actions-inline">
                      <ActionIconButton
                        onClick={() => setDetalle(r)}
                        icon="👁"
                        label="Ver detalle"
                      />

                      {r.puedeCancelar && (
                        <ActionIconButton
                          onClick={() => cancelarReserva(r.id)}
                          icon="✕"
                          label="Cancelar reserva"
                          variant="danger"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                <ActionIconButton
                  onClick={imprimirQR}
                  icon="🖨"
                  label="Imprimir QR"
                  variant="primary"
                />
              )}
              <ActionIconButton
                onClick={() => setDetalle(null)}
                icon="✕"
                label="Cerrar"
                variant="danger"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
