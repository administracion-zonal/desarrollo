import { useEffect, useState } from "react";
import "../App.css";

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

    setError(null);
    setOk(null);

    if (!form.fechaReserva) return setError("Seleccione una fecha");
    if (!form.horaInicio || !form.horaFin)
      return setError("Seleccione un horario válido");
    if (!form.destino) return setError("Ingrese un destino");

    try {
      await solicitudVehiculoService.crear({
        fecha: form.fechaReserva,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        motivo: `${form.destino} - ${form.observaciones}`,
      });

      setOk("✅ Reserva realizada correctamente");

      setForm({
        fechaReserva: "",
        horaInicio: "",
        horaFin: "",
        destino: "",
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
    <>
      <h2 style={{ textAlign: "center" }}>🚗 Solicitud de Vehículo</h2>

      <div className="reserva-layout">
        <div className="reserva-content">
          <form onSubmit={guardar} className="form-grid-2">
            {/* FECHA */}
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

            {/* HORARIO */}
            <div className="field span-2">
              <label>Horario</label>

              <div className="time-grid">
                {generarBloques().map((hora) => {
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

            {/* DESTINO */}
            <div className="field span-2">
              <label>Destino</label>
              <input
                value={form.destino}
                onChange={(e) => setForm({ ...form, destino: e.target.value })}
              />
            </div>

            {/* OBSERVACIONES */}
            <div className="field span-2">
              <label>Observaciones</label>
              <textarea
                value={form.observaciones}
                onChange={(e) =>
                  setForm({ ...form, observaciones: e.target.value })
                }
              />
            </div>

            <button className="actions span-2">Solicitar vehículo</button>

            {error && <p className="error">{error}</p>}
            {ok && <p style={{ color: "green" }}>{ok}</p>}
          </form>
        </div>
      </div>
    </>
  );
}
