import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { fechaActualLocal } from "../utils/dateUtils";

export default function ReservaVehiculoForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fechaReserva: "",
    horaInicio: "",
    horaFin: "",
    motivo: "",
    destino: "",
    origen: "",
    servidores: "",
    observaciones: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  /* ================= SUBMIT ================= */
  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!form.fechaReserva) return setError("Seleccione una fecha");
    if (form.fechaReserva < fechaActualLocal()) {
      return setError("No puede seleccionar una fecha anterior a hoy");
    }
    if (!form.horaInicio || !form.horaFin) {
      return setError("Seleccione un horario válido");
    }
    const inicioSolicitud = new Date(`${form.fechaReserva}T${form.horaInicio}`);
    if (inicioSolicitud.getTime() < Date.now() + 24 * 60 * 60 * 1000) {
      return setError("La solicitud debe realizarse con al menos 24 horas de anticipación");
    }
    if (!form.motivo.trim()) return setError("Ingrese el motivo de la solicitud");
    if (!form.origen.trim()) return setError("Ingrese el origen del traslado");
    if (!form.destino.trim()) return setError("Ingrese un destino");
    if (form.horaFin <= form.horaInicio) {
      return setError("La hora de retorno debe ser posterior a la hora de salida");
    }
    if (!form.servidores.trim()) {
      return setError("Ingrese los servidores o acompanantes del traslado");
    }

    try {
      await solicitudVehiculoService.crear({
        fecha: form.fechaReserva,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        motivo: form.motivo,
        destino: form.destino,
        observaciones: form.observaciones,
        origen: form.origen,
        servidores: form.servidores,
      });

      setOk("Solicitud enviada. Queda pendiente de revisión y aprobación.");
      setSolicitudEnviada(true);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error al crear reserva");
      }
    }
  };

  /* ================= UI ================= */
  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">
          Movilidad institucional
        </span>
        <h2>Solicitud de vehiculo</h2>
      </div>

      <div className="reserva-layout reserva-layout--compact">
        <div className="reserva-content">
          <div className="form-panel">
            {solicitudEnviada ? (
              <div className="reservation-summary">
                <div className="reservation-summary__card">
                  <h3>Solicitud enviada</h3>
                  <p className="reservation-summary__meta">
                    Tu solicitud de vehículo fue recibida y está pendiente de
                    revisión y aprobación. Recibirás la confirmación en{" "}
                    <strong>Mis reservas → Vehículos</strong>.
                  </p>
                  <span className="status-pill status-pill--pending">
                    Pendiente de aprobación
                  </span>
                  <div className="reservation-summary__actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate("/vehiculos/mis")}
                    >
                      Ver mis solicitudes
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setForm({
                          fechaReserva: "",
                          horaInicio: "",
                          horaFin: "",
                          motivo: "",
                          destino: "",
                          origen: "",
                          servidores: "",
                          observaciones: "",
                        });
                        setSolicitudEnviada(false);
                        setOk(null);
                      }}
                    >
                      Crear otra solicitud
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <form onSubmit={guardar} className="form-grid-2">
              <div className="field span-2">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fechaReserva}
                  min={fechaActualLocal()}
                  required
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) =>
                    setForm({ ...form, fechaReserva: e.target.value })
                  }
                />
              </div>

              <div className="field span-2">
                <label>Horario requerido</label>
                <div className="form-grid-2">
                  <input
                    type="time"
                    step={1800}
                    aria-label="Hora de salida"
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    required
                  />
                  <input
                    type="time"
                    step={1800}
                    aria-label="Hora de retorno"
                    value={form.horaFin}
                    onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                    required
                  />
                </div>
                <p className="hint">
                  Solicite con al menos 24 horas de anticipación. Los horarios
                  fuera de 08:00 a 16:30 requieren autorización del Administrador Zonal.
                </p>
              </div>

              <div className="field span-2">
                <label>Motivo</label>
                <input
                  value={form.motivo}
                  placeholder="Ejemplo: traslado para inspeccion tecnica o gestion territorial"
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Origen</label>
                <input
                  value={form.origen}
                  placeholder="Ejemplo: Administracion Zonal Valle de los Chillos"
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Destino</label>
                <input
                  value={form.destino}
                  placeholder="Ejemplo: traslado a inspeccion territorial"
                  onChange={(e) =>
                    setForm({ ...form, destino: e.target.value })
                  }
                />
              </div>

              <div className="field span-2">
                <label>Servidores / acompanantes</label>
                <textarea
                  placeholder="Detalle de servidores, equipos o acompanantes del recorrido"
                  value={form.servidores}
                  onChange={(e) =>
                    setForm({ ...form, servidores: e.target.value })
                  }
                />
              </div>

              <div className="field span-2">
                <label>Observaciones</label>
                <textarea
                  placeholder="Detalle breve del motivo o condiciones del recorrido"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                />
              </div>

              <button className="actions span-2" type="submit">Solicitar vehículo</button>

              {error && <p className="error span-2">{error}</p>}
              {ok && <p className="success-message span-2">{ok}</p>}
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
