import { useEffect, useState } from "react";

import { useVehiculosCatalogo } from "../hooks/useVehiculosCatalogo";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { generarBloques, toMinutes } from "../utils/timeUtils";
export default function ReservaVehiculoForm() {
  const { cargarVehiculos } = useVehiculosCatalogo();

  const [form, setForm] = useState({
    fechaReserva: "",
    horaInicio: "",
    horaFin: "",
    destino: "",
    motivo: "",
    observaciones: "",
    origen: "",
    servidores: "",
  });

  const [horaInicioSel, setHoraInicioSel] = useState<string | null>(null);
  const [horaFinSel, setHoraFinSel] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  /* ================= SELECCIÓN HORAS ================= */
  const seleccionarHora = (hora: string) => {
    if (!horaInicioSel) {
      setHoraInicioSel(hora);
      setHoraFinSel(null);
      return;
    }

    if (hora === horaInicioSel) {
      setHoraInicioSel(null);
      setHoraFinSel(null);
      setForm((prev) => ({ ...prev, horaInicio: "", horaFin: "" }));
      return;
    }

    const inicio = toMinutes(horaInicioSel);
    const fin = toMinutes(hora);

    if (fin <= inicio) return;
    if (fin - inicio > 480) return;

    setHoraFinSel(hora);

    setForm((prev) => ({
      ...prev,
      horaInicio: horaInicioSel,
      horaFin: hora,
    }));
  };

  /* ================= SUBMIT ================= */
  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("DATA ENVIADA:", {
      fecha: form.fechaReserva,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      motivo: form.motivo,
      destino: form.destino,
      observaciones: form.observaciones,
      origen: form.origen,
      servidores: form.servidores,
    });

    setError(null);
    setOk(null);

    if (!form.fechaReserva) return setError("Seleccione una fecha");
    if (!form.horaInicio || !form.horaFin) {
      console.error("HORAS INVALIDAS", form);
      return setError("Seleccione un horario válido");
    }
    if (!form.destino) return setError("Ingrese un destino");
    if (!form.motivo) return setError("Ingrese el motivo");

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

      setOk("✅ Reserva realizada correctamente");

      setForm({
        fechaReserva: "",
        horaInicio: "",
        horaFin: "",
        destino: "",
        motivo: "",
        observaciones: "",
        origen: "",
        servidores: "",
      });

      setHoraInicioSel(null);
      setHoraFinSel(null);
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
    <section className="vehiculo-page reservation-shell">
      <h2 className="vehiculo-title">Solicitud de Vehículo</h2>

      <div className="reserva-layout">
        <div className="reserva-content">
          <div className="form-card reservation-panel">
            <form onSubmit={guardar} className="form-grid-2">
              <div className="section-header span-2">
                <h3>Detalle de la movilización</h3>
              </div>

              {/* FECHA MOVILIZACIÓN */}
              <div className="field field--date">
                <label>Fecha de movilización</label>
                <input
                  type="date"
                  value={form.fechaReserva}
                  min={new Date().toISOString().split("T")[0]}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      fechaReserva: e.target.value,
                      horaInicio: "",
                      horaFin: "",
                    });
                    setHoraInicioSel(null);
                    setHoraFinSel(null);
                  }}
                />
              </div>

              {/* MOTIVO */}
              <div className="field field--motivo">
                <label>Motivo</label>
                <input
                  placeholder="Ej. traslado de equipo, reunión de trabajo"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </div>

              {/* SERVIDORES */}
              <div className="field field--servidores">
                <label>Servidores</label>
                <textarea
                  placeholder="Nombre(s) de las personas que viajan"
                  value={form.servidores}
                  onChange={(e) =>
                    setForm({ ...form, servidores: e.target.value })
                  }
                />
              </div>

              {/* ORIGEN */}
              <div className="field">
                <label>Origen</label>
                <input
                  placeholder="Lugar de origen"
                  value={form.origen}
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                />
              </div>

              {/* DESTINO */}
              <div className="field">
                <label>Destino</label>
                <input
                  placeholder="Lugar de destino"
                  value={form.destino}
                  onChange={(e) =>
                    setForm({ ...form, destino: e.target.value })
                  }
                />
              </div>

              {/* HORARIO */}
              <div className="field field--horario">
                <label>Horario</label>
                <div className="time-grid">
                  {generarBloques(form.fechaReserva).map((hora) => {
                    const esInicio = hora === horaInicioSel;
                    const esFin = hora === horaFinSel;

                    const seleccionada =
                      horaInicioSel &&
                      horaFinSel &&
                      toMinutes(hora) >= toMinutes(horaInicioSel) &&
                      toMinutes(hora) <= toMinutes(horaFinSel);

                    return (
                      <button
                        key={hora}
                        type="button"
                        className={`time-slot
                          ${seleccionada ? "selected" : ""}
                          ${esInicio ? "start" : ""}
                          ${esFin ? "end" : ""}
                        `}
                        onClick={() => seleccionarHora(hora)}
                      >
                        {hora}
                      </button>
                    );
                  })}
                </div>

                {horaInicioSel && horaFinSel && (
                  <p className="hint">
                    {horaInicioSel} - {horaFinSel}
                  </p>
                )}
              </div>

              {/* OBSERVACIONES */}
              <div className="field field--observaciones">
                <label>Observaciones</label>
                <textarea
                  placeholder="Información adicional, requerimientos o detalles relevantes"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                />
              </div>

              <button className="actions span-2">Solicitar vehículo</button>

              {error && <p className="error">{error}</p>}
              {ok && <p className="success-message">{ok}</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
