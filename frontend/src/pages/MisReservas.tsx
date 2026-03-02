import { useState } from "react";
import { useMisReservas } from "../hooks/useMisReservas";
import type { ReservaUsuario } from "../types/ReservaUsuario";
import { QRCodeCanvas } from "qrcode.react";

export default function MisReservas() {
  const { reservas, setReservas, loading, error } = useMisReservas();

  const [detalle, setDetalle] = useState<ReservaUsuario | null>(null);
  const [mostrarQR, setMostrarQR] = useState<ReservaUsuario | null>(null);

  const cancelarReserva = async (id: number) => {
    if (!confirm("¿Desea cancelar esta reserva?")) return;

    const token = localStorage.getItem("token");

    const res = await fetch(
      `http://localhost:8083/api/privado/reservas/${id}/cancelar`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      alert(await res.text());
      return;
    }

    setReservas((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <p>Cargando reservas...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h2>📅 Mis Reservas</h2>

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
                  <button onClick={() => setDetalle(r)}>Ver</button>

                  {r.vigente && r.qrToken && (
                    <button onClick={() => setMostrarQR(r)}>QR</button>
                  )}

                  {r.puedeCancelar && (
                    <button
                      style={{ color: "red" }}
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
            <h3>Detalle de reserva</h3>
            <p>
              <b>Fecha:</b> {detalle.fecha}
            </p>
            <p>
              <b>Horario:</b> {detalle.horaInicio} - {detalle.horaFin}
            </p>
            <p>
              <b>Área:</b> {detalle.nombreArea}
            </p>
            <p>
              <b>Institución:</b> {detalle.nombreInstitucion}
            </p>

            <button onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL QR */}
      {mostrarQR && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Código QR</h3>

            <QRCodeCanvas value={mostrarQR.qrToken!} size={200} />

            <p style={{ marginTop: "10px", fontSize: "12px" }}>
              Presente este código al ingresar
            </p>

            <button onClick={() => setMostrarQR(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
}
