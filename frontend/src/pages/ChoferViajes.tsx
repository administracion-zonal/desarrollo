import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function ChoferViajes() {
  type ViajeChofer = {
    idReserva: number;
    fechaReserva: string;
    horaInicio: string;
    horaFin: string;
    destino: string;
    observaciones: string;
    estado: string;
  };

  const [viajes, setViajes] = useState<ViajeChofer[]>([]);
  const [tab, setTab] = useState<"futuros" | "historial">("futuros");

  useEffect(() => {
    apiFetch("/api/vehiculos/chofer/viajes")
      .then((res) => res.json())
      .then(setViajes)
      .catch(console.error);
  }, []);

  const hoy = new Date().toISOString().split("T")[0];

  const filtrados = viajes.filter((v) =>
    tab === "futuros" ? v.fechaReserva >= hoy : v.fechaReserva < hoy,
  );

  const descargarPDF = async (idReserva: number) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8083/api/vehiculos/admin/ordenMovilizacion/${idReserva}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo descargar el PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `ordenMovilizacion_${idReserva}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error al descargar el PDF");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🚗 Mis Viajes</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("futuros")}>Futuros viajes</button>

        <button onClick={() => setTab("historial")}>Historial</button>
      </div>

      <table className="reservas-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Destino</th>
            <th>Hora</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {filtrados.map((v) => (
            <tr key={v.idReserva}>
              <td>{v.fechaReserva}</td>
              <td>{v.destino}</td>
              <td>
                {v.horaInicio} - {v.horaFin}
              </td>

              <td>
                <button onClick={() => descargarPDF(v.idReserva)}>
                  📄 Orden de Movilizacion
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
