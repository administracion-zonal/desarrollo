import { useEffect, useState } from "react";
import type { Reserva } from "../types/Reserva";
import { apiFetch } from "../utils/api";

const API_URL = `/api/reservas`;

export default function ListaReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [token, setToken] = useState<string>("");
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(API_URL)
      .then((res) => res.json())
      .then((data: Reserva[]) => setReservas(data))
      .catch(() => setMensaje("Error al cargar reservas"));
  }, []);

  const validarQR = async () => {
    if (!token.trim()) {
      setMensaje("Ingrese un token válido");
      return;
    }

    try {
      const res = await apiFetch(`${API_URL}/validar-qr/${token}`);

      const msg = await res.text();
      setMensaje(msg);
    } catch {
      setMensaje("Error al validar el QR");
    }
  };

  return (
    <>
      <h2>Listado de Reservas</h2>

      <table border={1} width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th>Nombres</th>
            <th>Cédula</th>
            <th>Institución</th>
            <th>Área</th>
            <th>Fecha</th>
            <th>Inicio</th>
            <th>Fin</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr key={r.id}>
              <td>{r.usuario?.nombres}</td>
              <td>{r.usuario?.cedula}</td>
              <td>{r.nombreInstitucion}</td>
              <td>{r.nombreArea}</td>
              <td>{r.fecha}</td>
              <td>{r.horaInicio}</td>
              <td>{r.horaFin}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h3>Validar código QR</h3>

      <input
        type="text"
        placeholder="Pegar token del QR"
        value={token}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setToken(e.target.value)
        }
        style={{ width: "300px", padding: "6px" }}
      />

      <br />
      <br />

      <button onClick={validarQR} disabled={!token.trim()}>
        Validar
      </button>

      {mensaje && (
        <p style={{ marginTop: "10px", fontWeight: "bold" }}>{mensaje}</p>
      )}
    </>
  );
}
