import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import ModalPortal from "../components/ModalPortal";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";
import { printReservationQr } from "../utils/printReservationQr";

const API = `/api/cancha/mis`;

export default function MisReservasCancha() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);

  const [detalle, setDetalle] = useState<ReservaCancha | null>(null);
  const [errorImpresion, setErrorImpresion] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

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
      setReservas((prev) =>
        prev.map((reserva) =>
          reserva.id === id ? { ...reserva, estado: "CANCELADO" } : reserva,
        ),
      );

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
    if (!detalle) return;
    const printed = printReservationQr(qrRef.current, "Reserva de cancha", [
      { label: "Fecha", value: detalle.fecha },
      { label: "Horario", value: `${detalle.horaInicio} - ${detalle.horaFin}` },
      { label: "Código", value: detalle.qrToken ?? "" },
    ]);
    setErrorImpresion(
      printed
        ? null
        : "Permite las ventanas emergentes para imprimir el código QR.",
    );
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
        <div className="table-responsive">
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
                  <td>
                    <span
                      className={`status-pill ${
                        r.estado === "ASISTIO"
                          ? "status-pill--success"
                          : r.estado === "NO_ASISTIO" || r.estado === "CANCELADO"
                            ? "status-pill--danger"
                            : "status-pill--pending"
                      }`}
                    >
                      {r.estado === "RESERVADO" ? "Pendiente" : r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setErrorImpresion(null);
                          setDetalle(r);
                        }}
                      >
                        Ver
                      </button>
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
        </div>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <ModalPortal>
          <div className="modal modal--fullscreen">
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
                  ref={qrRef}
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
            {errorImpresion && <p className="error" role="alert">{errorImpresion}</p>}
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
