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
      await solicitudVehiculoService.aprobar(
        solicitudSeleccionada.id,
        choferSeleccionado,
      );

      setModalOpen(false);
      setChoferSeleccionado(null);

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

      <table className="reservas-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Cédula</th>
            <th>Destino</th>
            <th>Fecha</th>
            <th>Horario</th>
            <th>Motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id}>
              <td>{s.nombres}</td>
              <td>{s.cedula}</td>
              <td>{s.destino}</td>
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
        <div className="modal-overlay">
          <div className="modal">
            {/* HEADER */}
            <div className="modal-header">Actualizar datos</div>

            <div className="field">
              <label>Asignar Chofer</label>

              {/* 🔽 SELECT */}
              <select
                className="select-chofer"
                value={choferSeleccionado ?? ""}
                onChange={(e) =>
                  setChoferSeleccionado(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Seleccione un chofer</option>

                {choferes.map((c) => (
                  <option key={c.idUsuario} value={c.idUsuario}>
                    {c.nombres}
                  </option>
                ))}
              </select>

              <button onClick={confirmarAprobacion}>✅ Confirmar</button>
              <button onClick={() => setModalOpen(false)}>❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
