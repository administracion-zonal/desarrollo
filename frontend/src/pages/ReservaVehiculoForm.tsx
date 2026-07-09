import { useEffect, useState } from "react";

import { useVehiculosCatalogo } from "../hooks/useVehiculosCatalogo";
import { solicitudVehiculoService } from "../services/solicitudVehiculoService";
import { esBloquePasado, generarBloques, toMinutes } from "../utils/timeUtils";
export default function ReservaVehiculoForm() {
  const { cargarVehiculos } = useVehiculosCatalogo();

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

  const [horaInicioSel, setHoraInicioSel] = useState<string | null>(null);
  const [horaFinSel, setHoraFinSel] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    cargarVehiculos();
  }, [cargarVehiculos]);

  /* ================= SELECCIÓN HORAS ================= */
  const seleccionarHora = (hora: string) => {
    if (esBloquePasado(form.fechaReserva, hora)) return;
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
      origen: form.origen,
      servidores: form.servidores,
      observaciones: form.observaciones,
    });

    setError(null);
    setOk(null);

    if (!form.fechaReserva) return setError("Seleccione una fecha");
    if (!form.horaInicio || !form.horaFin) {
      console.error("HORAS INVALIDAS", form);
      return setError("Seleccione un horario válido");
    }
    if (!form.motivo.trim())
      return setError("Ingrese el motivo de la solicitud");
    if (!form.origen.trim()) return setError("Ingrese el origen del traslado");
    if (!form.destino) return setError("Ingrese un destino");
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

      setOk("✅ Reserva realizada correctamente");

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
            <form onSubmit={guardar} className="form-grid-2">
              <div className="field span-2">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fechaReserva}
                  min={new Date().toISOString().split("T")[0]}
                  onKeyDown={(e) => e.preventDefault()}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(e) =>
                    setForm({ ...form, fechaReserva: e.target.value })
                  }
                />
              </div>

              <div className="field span-2">
                <label>Horario</label>

                <div className="time-grid">
                  {generarBloques().map((hora) => {
                    const horaPasada = esBloquePasado(form.fechaReserva, hora);
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
                        disabled={horaPasada}
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

              <button className="actions span-2">Solicitar vehículo</button>

              {error && <p className="error span-2">{error}</p>}
              {ok && <p className="success-message span-2">{ok}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
