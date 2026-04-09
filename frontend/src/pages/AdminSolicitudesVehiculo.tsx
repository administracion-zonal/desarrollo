import { useEffect, useState } from "react";
import type { SolicitudVehiculo } from "../services/solicitudVehiculoService";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { apiFetch } from "../utils/api";

type Chofer = {
  idUsuario: number;
  nombres: string;
};

export default function AdminSolicitudesVehiculo() {
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudVehiculo | null>(null);

  const [choferes, setChoferes] = useState<Chofer[]>([]);
  const [choferSeleccionado, setChoferSeleccionado] = useState<number | null>(
    null,
  );

  // 🔍 BUSCADOR
  const [busquedaChofer, setBusquedaChofer] = useState("");

  // 🔥 FILTRO + BUSCADOR
  const choferesFiltrados = choferes
    .filter((c) =>
      c.nombres.toLowerCase().includes(busquedaChofer.toLowerCase()),
    )
    .sort((a, b) => a.nombres.localeCompare(b.nombres));

  const abrirModal = (solicitud: SolicitudVehiculo) => {
    setSolicitudSeleccionada(solicitud);
    setModalOpen(true);
  };

  const confirmarAprobacion = async () => {
    if (!solicitudSeleccionada || choferSeleccionado === null) {
      alert("Seleccione un chofer");
      return;
    }

    try {
      await apiFetch(
        `/api/vehiculos/solicitudes/${solicitudSeleccionada.id}/aprobar`,
        {
          method: "POST",
          body: JSON.stringify({
            idChofer: choferSeleccionado,
          }),
        },
      );

      setModalOpen(false);
      setChoferSeleccionado(null);
      setBusquedaChofer("");

      await cargar();
    } catch (e) {
      console.error(e);
    }
  };

  const cargar = async () => {
    try {
      const data = await solicitudVehiculoService.listarPendientes();
      setSolicitudes(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error desconocido");
      }
    }
  };

  // 🔥 CARGAR CHOFERES
  useEffect(() => {
    apiFetch("/api/vehiculos/choferes")
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error("Error backend: " + text);
        }
        return res.json();
      })
      .then((data) => setChoferes(data))
      .catch((err) => {
        console.error("ERROR REAL:", err);
        setError(err.message);
      });
  }, []);

  // 🔥 CARGAR SOLICITUDES
  useEffect(() => {
    cargar();
  }, []);

  const rechazar = async (id: number) => {
    try {
      await solicitudVehiculoService.rechazar(id);
      await cargar();
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error desconocido");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Solicitudes de Vehículos (Admin)</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {solicitudes.length === 0 && <p>No hay solicitudes pendientes</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Cédula</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id}>
              <td>{s.usuario?.nombres}</td>
              <td>{s.usuario?.cedula}</td>
              <td>{s.fecha}</td>
              <td>
                {s.horaInicio} - {s.horaFin}
              </td>
              <td>{s.motivo}</td>

              <td>
                <button onClick={() => abrirModal(s)}>✅ Aprobar</button>
                <button onClick={() => rechazar(s.id)}>❌ Rechazar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
            }}
          >
            <h3>Asignar Chofer</h3>

            {/* 🔍 BUSCADOR */}
            <input
              type="text"
              placeholder="Buscar chofer..."
              value={busquedaChofer}
              onChange={(e) => setBusquedaChofer(e.target.value)}
              style={{
                width: "100%",
                marginBottom: "10px",
                padding: "5px",
              }}
            />

            {/* 🔽 SELECT */}
            <select
              value={choferSeleccionado ?? ""}
              onChange={(e) =>
                setChoferSeleccionado(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              style={{ width: "100%", marginBottom: "10px" }}
            >
              <option value="">Seleccione un chofer</option>
              {choferesFiltrados.map((c) => (
                <option key={c.idUsuario} value={c.idUsuario}>
                  {c.nombres}
                </option>
              ))}
            </select>

            <button onClick={confirmarAprobacion}>✅ Confirmar</button>
            <button onClick={() => setModalOpen(false)}>❌ Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
