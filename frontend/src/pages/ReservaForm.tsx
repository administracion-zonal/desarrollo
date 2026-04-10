import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import "../App.css";
import { useAuth } from "../context/useAuth";
import type { DisponibilidadResponse } from "../types/DisponibilidadResponse";
import type { Reserva } from "../types/Reserva";
import { apiFetch } from "../utils/api";
import { esDiaHabil, esFinDeSemana } from "../utils/dateUtils";
import { solapada } from "../utils/reservaUtils";
import { generarBloques, toMinutes } from "../utils/timeUtils";
import { validarCedula } from "../utils/validaciones";

const API_RESERVAS = `/public/reservas`;
export default function ReservaForm() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    cedula: user?.cedula || "",
    nombres: user?.nombres || "",
    nombreInstitucion: "",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    nombreArea: "",
  });

  const [error, setError] = useState<string | null>(null);

  const [horasBloqueadas, setHorasBloqueadas] = useState<string[]>([]);
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);
  const [horaInicioSel, setHoraInicioSel] = useState<string | null>(null);
  const [horaFinSel, setHoraFinSel] = useState<string | null>(null);
  const [cuposPorBloque, setCuposPorBloque] = useState<Record<string, number>>(
    {},
  );
  const BACKEND_URL = `${import.meta.env.VITE_API_URL}`;
  const qrRef = useRef<HTMLDivElement>(null);
  const HORA_MIN = "08:00";
  const HORA_MAX = "16:00";

  const areaImages: Record<string, string> = {
    SALA_REUNIONES: `${BACKEND_URL}/uploads/areas/SALA_REUNIONES.jpeg`,
    TRABAJO_INDIVIDUAL: `${BACKEND_URL}/uploads/areas/TRABAJO_INDIVIDUAL.jpeg`,
    COMPARTIDO_A: `${BACKEND_URL}/uploads/areas/COMPARTIDO_A.jpeg`,
    COMPARTIDO_B: `${BACKEND_URL}/uploads/areas/COMPARTIDO_B.jpeg`,
  };

  const bloqueBloqueado = (hora: string) => (cuposPorBloque[hora] ?? 0) === 0;

  const seleccionarHora = (hora: string) => {
    if (bloqueBloqueado(hora)) return;

    // Primer click → inicio
    if (!horaInicioSel) {
      setHoraInicioSel(hora);
      setHoraFinSel(null);
      setForm((prev) => ({ ...prev, horaInicio: "", horaFin: "" }));
      return;
    }

    // Click sobre la misma hora → reset
    if (hora === horaInicioSel) {
      setHoraInicioSel(null);
      setHoraFinSel(null);
      setForm((prev) => ({ ...prev, horaInicio: "", horaFin: "" }));
      return;
    }

    const inicio = toMinutes(horaInicioSel);
    const fin = toMinutes(hora);

    // Hora fin debe ser mayor
    if (fin <= inicio) return;

    // Máximo 2 horas
    if (fin - inicio > 120) return;

    // Validar bloques intermedios
    for (let t = inicio; t < fin; t += 30) {
      const h = `${Math.floor(t / 60)
        .toString()
        .padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
      if (bloqueBloqueado(h)) return;
    }

    // OK
    setHoraFinSel(hora);
    setForm((prev) => ({
      ...prev,
      horaInicio: horaInicioSel,
      horaFin: hora,
    }));
  };

  const imprimirQR = () => {
    const canvas = document.querySelector("canvas");

    if (!canvas) return;

    const qrImage = canvas.toDataURL("image/png");

    const ventana = window.open("", "_blank", "width=400,height=600");

    if (!ventana) return;

    ventana.document.write(`
    <html>
      <head>
        <title>Reserva Coworking</title>
        <style>
          body{
            font-family: Arial;
            text-align:center;
            padding:30px;
          }
          img{
            width:220px;
            margin-top:10px;
          }
        </style>
      </head>
      <body>

        <h3>Tu código de acceso</h3>

        <p>
        Administración Zonal Valle de los Chillos
        </p>

        <img src="${qrImage}" />

      </body>
    </html>
  `);

    ventana.document.close();

    ventana.focus();

    setTimeout(() => {
      ventana.print();
    }, 500);
  };

  /* ================= DISPONIBILIDAD ================= */
  useEffect(() => {
    if (!form.nombreArea || !form.fecha) return;

    apiFetch(
      `${API_RESERVAS}/disponibilidad?nombreArea=${form.nombreArea}&fecha=${form.fecha}`,
    )
      .then((res) => res.json())
      .then((data: DisponibilidadResponse) => {
        const cupos: Record<string, number> = {};

        data.bloques.forEach((b) => {
          cupos[b.hora] = Math.max(b.capacidad - b.ocupados, 0);
        });

        setCuposPorBloque(cupos);
        setHorasBloqueadas([]);
      })
      .catch(() => {
        setCuposPorBloque({});
        setHorasBloqueadas([]);
      });
  }, [form.nombreArea, form.fecha]);

  /* ================= HANDLERS ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "nombres" || name === "nombreInstitucion"
          ? value.toUpperCase()
          : value,
    }));
  };

  const enviarReserva = async (acepta: boolean) => {
    const payload = {
      ...form,
      aceptaAcuerdo: acepta,
    };

    const token = localStorage.getItem("token");

    //const res = await apiFetch(API_RESERVAS, {
    const res = await apiFetch(`${API_RESERVAS}/reservar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setReservaCreada(await res.json());
    } else {
      setError("Error al registrar la reserva");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!esDiaHabil(form.fecha)) {
      setError("Solo se permiten reservas de lunes a viernes");
      return;
    }

    if (form.horaInicio < HORA_MIN || form.horaFin > HORA_MAX) {
      setError("Horario permitido de 08:00 a 16:00");
      return;
    }

    if (form.horaFin <= form.horaInicio) {
      setError("Hora fin debe ser mayor a hora inicio");
      return;
    }

    if (solapada(form.horaInicio, form.horaFin, horasBloqueadas)) {
      setError("Horario no disponible");
      return;
    }

    await enviarReserva(true);
  };

  const formularioValido = () => {
    return (
      validarCedula(form.cedula) &&
      form.nombres.trim() !== "" &&
      form.nombreInstitucion.trim() !== "" &&
      form.nombreArea !== "" &&
      form.fecha !== "" &&
      form.horaInicio !== "" &&
      form.horaFin !== "" &&
      !solapada(form.horaInicio, form.horaFin, horasBloqueadas)
    );
  };

  /* ================= UI ================= */
  return (
    <>
      <h2 style={{ textAlign: "center" }}>Reserva Coworking</h2>
      <div className="reserva-layout">
        <div className="reserva-content">
          <div className="form-panel">
            <>
              {!reservaCreada && (
                <form onSubmit={handleSubmit} noValidate>
                  {/* 🔹 DESDE AQUÍ TODOS VEN */}

                  <div className={`fade-in form-grid-2`}>
                    <div className="field">
                      <label>Área</label>
                      <select
                        name="nombreArea"
                        value={form.nombreArea}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            nombreArea: value,
                            fecha: "",
                            horaInicio: "",
                            horaFin: "",
                          }));

                          setHoraInicioSel(null);
                          setHoraFinSel(null);
                          setHorasBloqueadas([]);
                          setCuposPorBloque({});
                        }}
                      >
                        <option value="">Seleccione</option>
                        <option value="SALA_REUNIONES">SALA REUNIONES</option>
                        <option value="TRABAJO_INDIVIDUAL">
                          TRABAJO INDIVIDUAL
                        </option>
                        <option value="COMPARTIDO_A">COMPARTIDO A</option>
                        <option value="COMPARTIDO_B">COMPARTIDO B</option>
                      </select>
                    </div>

                    <div className="field span-2">
                      <label>Institución a la que pertenece</label>
                      <input
                        name="nombreInstitucion"
                        value={form.nombreInstitucion}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="field span-2">
                      <label>Fecha</label>
                      <input
                        type="date"
                        name="fecha"
                        value={form.fecha}
                        min={new Date().toISOString().split("T")[0]}
                        onKeyDown={(e) => e.preventDefault()} // evita escribir manual
                        onChange={(e) => {
                          const value = e.target.value;

                          if (esFinDeSemana(value)) {
                            alert(
                              "Solo se permiten reservas de lunes a viernes",
                            );
                            return;
                          }

                          setForm((prev) => ({
                            ...prev,
                            fecha: value,
                          }));
                        }}
                      />
                    </div>

                    <div className="field span-2">
                      <label>Horario y cupos disponible</label>

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

                          const cuposDisponibles = cuposPorBloque[hora] ?? 0;

                          return (
                            <button
                              key={hora}
                              type="button"
                              disabled={bloqueada || cuposDisponibles === 0}
                              className={`time-slot
                              ${bloqueada ? "blocked" : ""}
                              ${seleccionada ? "selected" : ""}
                              ${esInicio ? "start" : ""}
                              ${esFin ? "end" : ""}
                            `}
                              onClick={() => seleccionarHora(hora)}
                            >
                              {hora}
                              <span className="cupos-mini">
                                {cuposDisponibles}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {horaInicioSel && horaFinSel && (
                        <p className="hint">
                          Horario seleccionado: <strong>{horaInicioSel}</strong>{" "}
                          – <strong>{horaFinSel}</strong>
                        </p>
                      )}
                    </div>

                    <button
                      className="actions span-2"
                      disabled={!formularioValido()}
                    >
                      Reservar
                    </button>

                    {error && <p className="error full">{error}</p>}
                  </div>
                </form>
              )}

              {user &&
                !reservaCreada &&
                form.nombreArea &&
                areaImages[form.nombreArea] && (
                  <div className="area-preview">
                    <img
                      src={areaImages[form.nombreArea]}
                      alt={form.nombreArea}
                    />
                  </div>
                )}

              {reservaCreada && (
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <div ref={qrRef}>
                    <h3>Tu código de acceso</h3>

                    <p style={{ fontSize: "15px", marginBottom: "10px" }}>
                      Gracias por confiar en la{" "}
                      <b>Administración Zonal Valle de los Chillos</b>.
                    </p>

                    <p style={{ fontSize: "14px" }}>
                      Su reserva es para el día <b>{reservaCreada.fecha}</b>
                      <br />
                      en el horario de <b>{reservaCreada.horaInicio}</b> a{" "}
                      <b>{reservaCreada.horaFin}</b>
                    </p>

                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        color: "#555",
                      }}
                    >
                      Código de validación:
                    </p>

                    <QRCodeCanvas
                      value={`${reservaCreada.qrToken}`}
                      size={220}
                    />

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#777",
                        marginTop: "8px",
                      }}
                    >
                      {reservaCreada.qrToken}
                    </p>

                    <p style={{ fontSize: "12px", marginTop: "10px" }}>
                      Presente este código al momento de su ingreso.
                    </p>
                  </div>
                  <button className="btn" onClick={imprimirQR}>
                    🖨 Imprimir QR
                  </button>
                </div>
              )}
            </>
          </div>
        </div>
      </div>
    </>
  );
}
