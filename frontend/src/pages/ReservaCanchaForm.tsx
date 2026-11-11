import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import type { ReservaCancha } from "../types/ReservaCancha";
import { apiFetch } from "../utils/api";
import { esDiaHabil, esFinDeSemana, fechaActualLocal } from "../utils/dateUtils";
import { esBloquePasado, generarBloques, toMinutes } from "../utils/timeUtils";
import { printReservationQr } from "../utils/printReservationQr";

const API = `/api/cancha`;
const HORA_INICIO_CANCHA = "06:00";
const HORA_FIN_CANCHA = "20:00";

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
  const [canchaBloqueado, setCanchaBloqueado] = useState(false);
  const [solicitudDesbloqueo, setSolicitudDesbloqueo] = useState<{
    id: number;
    estado: string;
    observacion: string | null;
  } | null>(null);

  const [reservaCreada, setReservaCreada] = useState<ReservaCancha | null>(
    null,
  );
  const [errorImpresion, setErrorImpresion] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  /* ================= DISPONIBILIDAD ================= */
  useEffect(() => {
    if (!form.fecha) return;

    apiFetch(
      `${API}/disponibilidad?fecha=${form.fecha}&cedula=${encodeURIComponent(user?.cedula ?? "")}`,
    )
      .then((res) => res.json())
      .then((data: {
        bloqueado: boolean;
        canchaBloqueado: boolean;
        horas: string[];
      }) => {
        setCanchaBloqueado(data.canchaBloqueado);
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
        setCanchaBloqueado(false);
        setOcupados([]);
      });
  }, [form.fecha, user?.cedula]);

  useEffect(() => {
    if (!user) return;
    apiFetch(`${API}/desbloqueo/mis`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSolicitudDesbloqueo(data))
      .catch(() => setSolicitudDesbloqueo(null));
  }, [user]);

  const solicitarDesbloqueo = async () => {
    try {
      const res = await apiFetch(`${API}/desbloqueo`, { method: "POST" });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setSolicitudDesbloqueo(await res.json());
    } catch {
      setError("No se pudo enviar la solicitud de revisión");
    }
  };

  const bloqueBloqueado = (hora: string) => ocupados.includes(hora);

  const imprimirQR = () => {
    const printed = printReservationQr(qrRef.current, "Reserva de cancha", [
      { label: "Fecha", value: reservaCreada?.fecha ?? "" },
      {
        label: "Titular",
        value: reservaCreada?.usuario?.nombres ?? user?.nombres ?? "",
      },
      {
        label: "Horario",
        value: `${reservaCreada?.horaInicio ?? ""} - ${reservaCreada?.horaFin ?? ""}`,
      },
      { label: "Código", value: reservaCreada?.qrToken ?? "" },
    ]);
    setErrorImpresion(
      printed
        ? null
        : "No se pudo abrir la ventana de impresión. Permite las ventanas emergentes e inténtalo otra vez.",
    );
  };

  /* ================= SELECCIÓN HORAS ================= */
  const seleccionarHora = (hora: string) => {
    if (esBloquePasado(form.fecha, hora)) return;

    // inicio
    if (!horaInicioSel) {
      if (bloqueBloqueado(hora)) return;
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

    if (canchaBloqueado || bloquearDia) {
      setError(
        canchaBloqueado
          ? "Su cuenta está bloqueada para reservas de cancha"
          : "Ya tiene una reserva este día",
      );
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
        setBloquearDia(true);
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
              {!reservaCreada && (
                <>
              {/* FECHA */}
              <div className="field span-2">
                <label>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  min={fechaActualLocal()}
                  onKeyDown={(e) => e.preventDefault()}
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
              {canchaBloqueado && (
                <div className="field span-2">
                  <p className="error">
                    Su cuenta está bloqueada para reservas de cancha. La
                    reactivación requiere revisión administrativa.
                  </p>
                  {solicitudDesbloqueo?.estado === "PENDIENTE" ? (
                    <p className="hint">Su solicitud está pendiente de revisión.</p>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={solicitarDesbloqueo}
                    >
                      Solicitar revisión del bloqueo
                    </button>
                  )}
                  {solicitudDesbloqueo?.estado === "RECHAZADA" &&
                    solicitudDesbloqueo.observacion && (
                      <p className="hint">
                        Respuesta administrativa: {solicitudDesbloqueo.observacion}
                      </p>
                    )}
                </div>
              )}
              {/* HORARIOS */}
              <div className="field span-2">
                <label>Horario disponible</label>

                <div className="time-grid time-grid--cancha">
                  {generarBloques(
                    HORA_INICIO_CANCHA,
                    HORA_FIN_CANCHA,
                    true,
                  ).map((hora) => {
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
                        disabled={
                          horaPasada ||
                          (hora === HORA_FIN_CANCHA
                            ? !horaInicioSel
                            : bloqueada)
                        }
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
              <button
                className="actions span-2"
                disabled={!formularioValido || bloquearDia || canchaBloqueado}
              >
                Reservar cancha
              </button>
                </>
              )}
              {reservaCreada && (
                <div className="reservation-summary span-2">
                  <div className="reservation-summary__card" ref={qrRef}>
                    <h3>Tu código de acceso</h3>

                    {reservaCreada.usuario?.nombres && (
                      <p className="reservation-summary__meta">
                        Titular: <strong>{reservaCreada.usuario.nombres}</strong>
                      </p>
                    )}
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
                  <div className="reservation-summary__actions">
                    <button type="button" className="btn" onClick={imprimirQR}>
                      Imprimir QR
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setReservaCreada(null);
                        setErrorImpresion(null);
                      }}
                    >
                      Volver al formulario
                    </button>
                  </div>
                  {errorImpresion && (
                    <p className="error">{errorImpresion}</p>
                  )}
                </div>
              )}

              {/* MENSAJES */}
              {!reservaCreada && error && (
                <p className="error span-2">{error}</p>
              )}
              {!reservaCreada && ok && (
                <p className="success-message span-2">{ok}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
