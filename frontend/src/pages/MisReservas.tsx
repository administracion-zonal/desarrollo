import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import ModalPortal from "../components/ModalPortal";
import { useMisReservas } from "../hooks/useMisReservas";
import type { ReservaUsuario } from "../types/ReservaUsuario";
import { apiFetch } from "../utils/api";
import { printReservationQr } from "../utils/printReservationQr";

export default function MisReservas() {
  const { reservas, setReservas, loading, error } = useMisReservas();

  const [detalle, setDetalle] = useState<ReservaUsuario | null>(null);
  const [errorImpresion, setErrorImpresion] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const imprimirQR = () => {
    if (!detalle) return;
    const printed = printReservationQr(qrRef.current, "Reserva de coworking", [
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

    setReservas((prev) =>
      prev.map((reserva) =>
        reserva.id === id
          ? {
              ...reserva,
              estado: "CANCELADO",
              vigente: false,
              puedeCancelar: false,
              qrToken: undefined,
            }
          : reserva,
      ),
    );
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
        <div className="table-responsive">
          <table className="reservas-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Área</th>
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
                  <td>{r.nombreArea}</td>
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
                      {r.estado === "RESERVADO" ? "Reservada" : r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => {
                        setErrorImpresion(null);
                        setDetalle(r);
                      }}>Ver</button>

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
        </div>
      )}

      {/* MODAL DETALLE */}
      {detalle && (
        <ModalPortal>
          <div className="modal modal--fullscreen">
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
                <div>
                  <label>Estado: </label>
                  <input
                    value={detalle.estado === "RESERVADO" ? "Reservada" : detalle.estado}
                    readOnly
                  />
                </div>
              </div>
              <label>Codigo QR: </label>
              <div
                ref={qrRef}
                style={{ display: "grid", justifyItems: "center" }}
              >
                {detalle.vigente && detalle.qrToken && (
                  <QRCodeCanvas value={detalle.qrToken} size={150} />
                )}
              </div>
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
            {errorImpresion && <p className="error" role="alert">{errorImpresion}</p>}
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
