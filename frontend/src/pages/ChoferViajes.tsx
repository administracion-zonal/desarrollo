import { useEffect, useState } from "react";
import ActionIconButton from "../components/ActionIconButton";
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
    estadoViaje?: string;
    comentarioNoPresentacion?: string;
    noSePresento?: boolean;
    nombreSolicitante?: string;
    cedulaSolicitante?: string;
    nombreChofer?: string;
    cedulaChofer?: string;
    marcaVehiculo?: string;
    modeloVehiculo?: string;
    placaVehiculo?: string;
  };

  const [viajes, setViajes] = useState<ViajeChofer[]>([]);
  const [tab, setTab] = useState<"futuros" | "historial">("futuros");
  const [detalle, setDetalle] = useState<ViajeChofer | null>(null);
  const [comentarioNoPresento, setComentarioNoPresento] = useState("");
  const [objetivoNoPresento, setObjetivoNoPresento] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const cargarViajes = () => {
    apiFetch("/api/vehiculos/chofer/viajes")
      .then((res) => res.json())
      .then(setViajes)
      .catch(console.error);
  };

  useEffect(() => {
    cargarViajes();
  }, []);

  const esHistorial = (v: ViajeChofer) =>
    ["INICIADO", "NO_PRESENTO", "FINALIZADA"].includes(v.estadoViaje || "");

  const filtrados = viajes.filter((v) =>
    tab === "futuros" ? !esHistorial(v) : esHistorial(v),
  );

  const iniciarViaje = async (idReserva: number) => {
    setError(null);

    try {
      const iniciar = await apiFetch(
        `/api/vehiculos/chofer/viajes/${idReserva}/iniciar`,
        {
          method: "PUT",
        },
      );

      if (!iniciar.ok) {
        const text = await iniciar.text();
        throw new Error(text || "No se pudo iniciar el viaje");
      }

      await descargarPDF(idReserva);
      cargarViajes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar viaje");
    }
  };

  const guardarNoPresento = async () => {
    if (!objetivoNoPresento) return;
    if (!comentarioNoPresento.trim()) {
      setError("Debe ingresar el comentario de no presentación");
      return;
    }

    setError(null);

    try {
      const res = await apiFetch(
        `/api/vehiculos/chofer/viajes/${objetivoNoPresento}/no-presento`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comentario: comentarioNoPresento.trim() }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo registrar la no presentación");
      }

      setComentarioNoPresento("");
      setObjetivoNoPresento(null);
      cargarViajes();
      setTab("historial");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar evento");
    }
  };

  const descargarPDF = async (idReserva: number) => {
    try {
      const response = await apiFetch(
        `/api/vehiculos/chofer/ordenMovilizacion/${idReserva}`,
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
      throw new Error("Error al descargar el PDF");
    }
  };

  return (
    <section className="reservation-shell">
      <h2 className="page-title">Mis viajes de chofer</h2>
      {error && <p className="error">{error}</p>}

      <div className="tabs-container">
        <button
          className={`tab ${tab === "futuros" ? "active" : ""}`}
          onClick={() => setTab("futuros")}
        >
          Futuros viajes
        </button>

        <button
          className={`tab ${tab === "historial" ? "active" : ""}`}
          onClick={() => setTab("historial")}
        >
          Historial
        </button>
      </div>

      <div className="reservation-table-panel table-wrap">
        <table className="reservas-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Destino</th>
              <th>Hora</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map((v) => (
              <tr key={v.idReserva}>
                <td>{v.idReserva}</td>
                <td>{v.fechaReserva}</td>
                <td>{v.destino}</td>
                <td>
                  {v.horaInicio} - {v.horaFin}
                </td>
                <td>{v.estadoViaje || "PENDIENTE"}</td>

                <td>
                  <div className="actions-inline">
                    {v.estado === "APROBADA" &&
                      (v.estadoViaje === "PENDIENTE" || !v.estadoViaje) && (
                        <ActionIconButton
                          onClick={() => iniciarViaje(v.idReserva)}
                          icon="🚗"
                          label="Generar orden e iniciar viaje"
                          variant="success"
                        />
                      )}

                    {v.estado === "APROBADA" &&
                      (v.estadoViaje === "PENDIENTE" || !v.estadoViaje) && (
                        <ActionIconButton
                          onClick={() => setObjetivoNoPresento(v.idReserva)}
                          icon="⚠"
                          label="No se presentó"
                          variant="danger"
                        />
                      )}

                    {v.estadoViaje === "INICIADO" && (
                      <ActionIconButton
                        onClick={() => descargarPDF(v.idReserva)}
                        icon="📄"
                        label="Descargar orden"
                        variant="primary"
                      />
                    )}

                    <ActionIconButton
                      onClick={() => setDetalle(v)}
                      icon="👁"
                      label="Ver detalle completo"
                      variant="warning"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {objetivoNoPresento && (
        <div
          className="modal-overlay"
          onClick={() => setObjetivoNoPresento(null)}
        >
          <div
            className="modal chofer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">Registrar no presentación</div>
            <div className="field" style={{ marginTop: "0.75rem" }}>
              <label>Comentario obligatorio</label>
              <textarea
                value={comentarioNoPresento}
                onChange={(e) => setComentarioNoPresento(e.target.value)}
                placeholder="Explique por qué el usuario no se presentó"
              />
            </div>

            <div className="actions-inline" style={{ marginTop: "1rem" }}>
              <ActionIconButton
                onClick={guardarNoPresento}
                icon="✓"
                label="Guardar"
                variant="danger"
              />
              <ActionIconButton
                onClick={() => {
                  setObjetivoNoPresento(null);
                  setComentarioNoPresento("");
                }}
                icon="✕"
                label="Cancelar"
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div
            className="modal chofer-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              Detalle de viaje #{detalle.idReserva}
            </div>
            <div className="field">
              <strong>Estado:</strong> {detalle.estadoViaje || "PENDIENTE"}
            </div>
            <div className="field">
              <strong>Fecha:</strong> {detalle.fechaReserva}
            </div>
            <div className="field">
              <strong>Horario:</strong> {detalle.horaInicio} - {detalle.horaFin}
            </div>
            <div className="field">
              <strong>Destino:</strong> {detalle.destino}
            </div>
            <div className="field">
              <strong>Observaciones:</strong>{" "}
              {detalle.observaciones || "Sin observaciones"}
            </div>
            <div className="field">
              <strong>Solicitante:</strong>{" "}
              {detalle.nombreSolicitante || "No disponible"}
            </div>
            <div className="field">
              <strong>Cédula solicitante:</strong>{" "}
              {detalle.cedulaSolicitante || "No disponible"}
            </div>
            <div className="field">
              <strong>Chofer:</strong> {detalle.nombreChofer || "No disponible"}
            </div>
            <div className="field">
              <strong>Vehículo:</strong>{" "}
              {[
                detalle.marcaVehiculo,
                detalle.modeloVehiculo,
                detalle.placaVehiculo,
              ]
                .filter(Boolean)
                .join(" - ") || "No disponible"}
            </div>
            {detalle.noSePresento && (
              <div className="field">
                <strong>Comentario no presentación:</strong>{" "}
                {detalle.comentarioNoPresentacion || "Sin comentario"}
              </div>
            )}
            <div className="actions-inline" style={{ marginTop: "1rem" }}>
              <ActionIconButton
                onClick={() => setDetalle(null)}
                icon="✕"
                label="Cerrar"
                variant="primary"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
