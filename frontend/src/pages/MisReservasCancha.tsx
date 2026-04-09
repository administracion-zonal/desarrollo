import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";

const API = `/api/cancha/mis`;

export default function MisReservasCancha() {
  const [reservas, setReservas] = useState<ReservaCancha[]>([]);

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

      {reservas.map((r) => (
        <div key={r.id} className="perfil-card">
          <p>
            <strong>Fecha:</strong> {r.fecha}
          </p>
          <p>
            <strong>Horario:</strong> {r.horaInicio} - {r.horaFin}
          </p>

          <p>
            <strong>Estado:</strong>{" "}
            {r.estado === "RESERVADO" && "🟡 Pendiente"}
            {r.estado === "ASISTIO" && "🟢 Asistió"}
            {r.estado === "NO_ASISTIO" && "🔴 No asistió"}
          </p>

          {/* SOLO SI ESTA ACTIVA */}
          {r.estado === "RESERVADO" && (
            <QRCodeCanvas value={r.qrToken} size={150} />
          )}
        </div>
      ))}
    </>
  );
}
