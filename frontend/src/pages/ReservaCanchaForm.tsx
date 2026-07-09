import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";
import { esDiaHabil, esFinDeSemana } from "../utils/dateUtils";
import { esBloquePasado, generarBloques, toMinutes } from "../utils/timeUtils";

const API = `/api/cancha`;

export default function ReservaCanchaForm() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    fecha: "",
    horaInicio: "",
    horaFin: "",
    nombreInstitucion: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [horaInicioSel, setHoraInicioSel] = useState<string | null>(null);
  const [horaFinSel, setHoraFinSel] = useState<string | null>(null);

  const [ocupados, setOcupados] = useState<string[]>([]);

  const [bloquearDia, setBloquearDia] = useState(false);

  const [reservaCreada, setReservaCreada] = useState<ReservaCancha | null>(
    null,
  );

  /* ================= DISPONIBILIDAD ================= */
  useEffect(() => {
    if (!form.fecha) return;

    apiFetch(`${API}/disponibilidad?fecha=${form.fecha}`)
      .then((res) => res.json())
      .then((data: { bloqueado: boolean; horas: string[] }) => {
        if (data.bloqueado) {
          setBloquearDia(true);
          setOcupados([]);
        } else {
          setBloquearDia(false);
          setOcupados(data.horas || []);
        }
      })
      .catch(() => {
        setBloquearDia(false);
        setOcupados([]);
      });
  }, [form.fecha]);

  const bloqueBloqueado = (hora: string) => ocupados.includes(hora);

  /* ================= SELECCIÓN HORAS ================= */
  const seleccionarHora = (hora: string) => {
    if (esBloquePasado(form.fecha, hora)) return;
    if (bloqueBloqueado(hora)) return;

    // inicio
    if (!horaInicioSel) {
      setHoraInicioSel(hora);
      setHoraFinSel(null);
      return;
    }

    // reset
    if (hora === horaInicioSel) {
      setHoraInicioSel(null);
      setHoraFinSel(null);
      setForm((prev) => ({ ...prev, horaInicio: "", horaFin: "" }));
      return;
    }

    const inicio = toMinutes(horaInicioSel);
    const fin = toMinutes(hora);

    if (fin <= inicio) return;
    if (fin - inicio > 120) return;

    // validar bloques ocupados
    for (let t = inicio; t < fin; t += 30) {
      const h = `${Math.floor(t / 60)
        .toString()
        .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;

      if (bloqueBloqueado(h)) return;
    }

    setHoraFinSel(hora);

    setForm((prev) => ({
      ...prev,
      horaInicio: horaInicioSel,
      horaFin: hora,
    }));
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!esDiaHabil(form.fecha)) {
      setError("Solo se permiten reservas de lunes a viernes");
      return;
    }

    if (!form.horaInicio || !form.horaFin) {
      setError("Seleccione un horario válido");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const res = await apiFetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...form,
          cedula: user?.cedula,
          nombres: user?.nombres,
          correo: user?.correo,
        }),
      });

      if (res.ok) {
        const data: ReservaCancha = await res.json();

        setReservaCreada(data); // 👈 GUARDAS LA RESERVA REAL
        setOk("✅ Reserva realizada correctamente");

        // reset UI
        setHoraInicioSel(null);
        setHoraFinSel(null);

        setForm((prev) => ({
          ...prev,
          horaInicio: "",
          horaFin: "",
        }));

        // refrescar disponibilidad
        const inicio = toMinutes(form.horaInicio);
        const fin = toMinutes(form.horaFin);

        const nuevosBloques: string[] = [];

        for (let t = inicio; t < fin; t += 30) {
          const h = `${Math.floor(t / 60)
            .toString()
            .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;

          nuevosBloques.push(h);
        }

        setOcupados((prev) => [...prev, ...nuevosBloques]);
      } else {
        const txt = await res.text();
        setError(txt);
      }
    } catch {
      setError("Error de conexión con el servidor");
    }
  };

  /* ================= VALIDACIÓN ================= */
  const formularioValido = form.fecha && form.horaInicio && form.horaFin;

  /* ================= UI ================= */
  return (
    <div className="reservation-page">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Canchas</span>
        <h2>Reserva de cancha</h2>
      </div>

      <div className="reserva-layout reserva-layout--compact">
        <div className="reserva-content">
          <div className="form-panel form-panel--narrow">
            <form onSubmit={handleSubmit} className="form-grid-2">
              {/* FECHA */}
              <div className="field span-2">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  min={new Date().toISOString().split("T")[0]}
                  onKeyDown={(e) => e.preventDefault()}
                  disabled={bloquearDia}
                  onFocus={(e) => e.target.showPicker?.()}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (esFinDeSemana(value)) {
                      alert("Solo se permiten reservas de lunes a viernes");
                      return;
                    }

                    // ✅ LIMPIAR AQUÍ (CORRECTO)
                    setError(null);
                    setOk(null);

                    setForm((prev) => ({ ...prev, fecha: value }));

                    // reset horas
                    setHoraInicioSel(null);
                    setHoraFinSel(null);
                  }}
                />
              </div>
              {bloquearDia && (
                <p className="error">Ya tiene una reserva este día</p>
              )}
              {/* HORARIOS */}
              <div className="field span-2">
                <label>Horario disponible</label>

                <div className="time-grid time-grid--cancha">
                  {generarBloques().map((hora) => {
                    const bloqueada = bloqueBloqueado(hora);
                    const horaPasada = esBloquePasado(form.fecha, hora);
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
                        disabled={bloqueada || horaPasada}
                        className={`time-slot
                          ${bloqueada ? "blocked" : ""}
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
                    Horario seleccionado: <strong>{horaInicioSel}</strong> –{" "}
                    <strong>{horaFinSel}</strong>
                  </p>
                )}
              </div>

              {/* BOTÓN */}
              <button className="actions span-2" disabled={!formularioValido}>
                Reservar cancha
              </button>

              {reservaCreada && (
                <div className="reservation-summary span-2">
                  <div className="reservation-summary__card">
                    <h3>Tu código de acceso</h3>

                    <p className="reservation-summary__meta">
                      Tu reserva está confirmada para el día:
                      <br />
                      <strong>{reservaCreada.fecha}</strong>
                    </p>

                    <p className="reservation-summary__meta">
                      Horario:
                      <br />
                      <strong>
                        {reservaCreada.horaInicio} - {reservaCreada.horaFin}
                      </strong>
                    </p>

                    <p className="reservation-summary__meta">
                      Presenta este código al ingresar
                    </p>

                    <QRCodeCanvas value={reservaCreada.qrToken} size={200} />

                    <p className="reservation-summary__code">
                      Código: {reservaCreada.qrToken}
                    </p>
                  </div>
                </div>
              )}

              {/* MENSAJES */}
              {error && <p className="error span-2">{error}</p>}
              {ok && <p className="success-message span-2">{ok}</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
