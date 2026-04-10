import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useState } from "react";
import "../App.css";
import { useAuth } from "../context/useAuth";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";
import { esDiaHabil, esFinDeSemana } from "../utils/dateUtils";
import { generarBloques, toMinutes } from "../utils/timeUtils";

const API = `/cancha`;

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
    <>
      <h2 style={{ textAlign: "center" }}>⚽ Reserva de Cancha</h2>

      <div className="reserva-layout">
        <div className="reserva-content">
          <div className="form-grid-2">
            <form onSubmit={handleSubmit}>
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

                <div className="time-grid">
                  {generarBloques().map((hora) => {
                    const bloqueada = bloqueBloqueado(hora);
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
                        disabled={bloqueada}
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
                <div style={{ textAlign: "center", marginTop: "20px" }}>
                  <h3>Tu código de acceso</h3>

                  <p style={{ fontSize: "14px" }}>
                    Tu reserva está confirmada para el día:
                    <br />
                    <strong>{reservaCreada.fecha}</strong>
                  </p>

                  <p style={{ fontSize: "14px" }}>
                    Horario:
                    <br />
                    <strong>
                      {reservaCreada.horaInicio} - {reservaCreada.horaFin}
                    </strong>
                  </p>

                  <p style={{ fontSize: "13px", color: "#666" }}>
                    Presenta este código al ingresar
                  </p>

                  <QRCodeCanvas value={reservaCreada.qrToken} size={200} />

                  <p
                    style={{
                      fontSize: "12px",
                      marginTop: "10px",
                      color: "#888",
                    }}
                  >
                    Código: {reservaCreada.qrToken}
                  </p>
                </div>
              )}

              {/* MENSAJES */}
              {error && <p className="error">{error}</p>}
              {ok && <p style={{ color: "green" }}>{ok}</p>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
