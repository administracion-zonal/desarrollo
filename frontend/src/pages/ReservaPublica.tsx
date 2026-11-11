import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AcuerdoResponsabilidadModal from "../components/modals/AcuerdoResponsabilidadModal";
import { useAuth } from "../context/useAuth";
import type { DisponibilidadResponse } from "../types/DisponibilidadResponse";
import type { Reserva } from "../types/Reserva";
import { apiFetch } from "../utils/api";
import { esDiaHabil, esFinDeSemana, fechaActualLocal } from "../utils/dateUtils";
import { solapada } from "../utils/reservaUtils";
import { generarBloques, toMinutes } from "../utils/timeUtils";
import { validarCedula } from "../utils/validaciones";
import { printReservationQr } from "../utils/printReservationQr";

const API_RESERVAS = `/api/public/reservas`;
const API_USUARIOS = `/api/usuarios`;

const initialForm = {
  cedula: "",
  nombres: "",
  tipoUsuario: "",
  nombreInstitucion: "",
  nombreArea: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  correo: "",
  numeroPersonas: 1,
};

export default function ReservaPublica() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/reservar");
    }
  }, [user, navigate]);

  const [usuarioAceptoAcuerdo, setUsuarioAceptoAcuerdo] = useState(false);

  const [form, setForm] = useState(() => {
    if (user) {
      return {
        ...initialForm,
        cedula: user.cedula,
        nombres: user.nombres,
        correo: user.correo,
      };
    }
    return initialForm;
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [bloquearNombre, setBloquearNombre] = useState(false);
  const [mensajeCedula, setMensajeCedula] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorImpresion, setErrorImpresion] = useState<string | null>(null);
  const [cuposPorBloque, setCuposPorBloque] = useState<Record<string, number>>(
    {},
  );

  const [horasBloqueadas, setHorasBloqueadas] = useState<string[]>([]);
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

  const [horaInicioSel, setHoraInicioSel] = useState<string | null>(null);
  const [horaFinSel, setHoraFinSel] = useState<string | null>(null);
  const [bloquearCorreo, setBloquearCorreo] = useState(false);
  const cedulaRef = useRef<HTMLInputElement>(null);

  const [reseteando, setReseteando] = useState(false);

  const BACKEND_URL = `${import.meta.env.VITE_API_URL}`;

  const HORA_MIN = "08:00";
  const HORA_MAX = "16:30";
  const maxPersonas = form.nombreArea === "SALA_REUNIONES" ? 9 : 4;

  const [mostrarModal, setMostrarModal] = useState(false);

  const areaImages: Record<string, string> = {
    SALA_REUNIONES: `${BACKEND_URL}/uploads/areas/SALA_REUNIONES.jpeg`,
    TRABAJO_INDIVIDUAL: `${BACKEND_URL}/uploads/areas/TRABAJO_INDIVIDUAL.jpeg`,
    COMPARTIDO_A: `${BACKEND_URL}/uploads/areas/COMPARTIDO_A.jpeg`,
    COMPARTIDO_B: `${BACKEND_URL}/uploads/areas/COMPARTIDO_B.jpeg`,
  };

  const nuevaReserva = () => {
    setReseteando(true);

    setTimeout(() => {
      setMostrarFormulario(false);
      setReservaCreada(null);
      setForm(initialForm);
      setHoraInicioSel(null);
      setHoraFinSel(null);
      setBloquearNombre(false);
      setCuposPorBloque({});
      setHorasBloqueadas([]);
      setError(null);
      setErrorImpresion(null);
      setMensajeCedula(null);
      setReseteando(false);
      setUsuarioAceptoAcuerdo(false);

      cedulaRef.current?.focus();
    }, 300); // duración animación
  };

  const bloqueBloqueado = (hora: string) => (cuposPorBloque[hora] ?? 0) === 0;

  const seleccionarHora = (hora: string) => {
    // Primer click → inicio
    if (!horaInicioSel) {
      if (
        (cuposPorBloque[hora] ?? 0) <
        (form.nombreArea === "SALA_REUNIONES" ? 1 : form.numeroPersonas)
      ) return;
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
      if (
        (cuposPorBloque[h] ?? 0) <
        (form.nombreArea === "SALA_REUNIONES" ? 1 : form.numeroPersonas)
      ) return;
    }

    // OK
    setHoraFinSel(hora);
    setForm((prev) => ({
      ...prev,
      horaInicio: horaInicioSel,
      horaFin: hora,
    }));
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const imprimirQR = () => {
    const printed = printReservationQr(qrRef.current, "Reserva de coworking", [
      { label: "Fecha", value: reservaCreada?.fecha ?? "" },
      {
        label: "Horario",
        value: `${reservaCreada?.horaInicio ?? ""} - ${reservaCreada?.horaFin ?? ""}`,
      },
      { label: "Área", value: form.nombreArea },
      { label: "Código", value: reservaCreada?.qrToken ?? "" },
    ]);
    setErrorImpresion(
      printed
        ? null
        : "No se pudo abrir la ventana de impresión. Permite las ventanas emergentes e inténtalo otra vez.",
    );
  };

  /* ================= VALIDAR CÉDULA ================= */
  const validarCedulaBlur = async () => {
    setMensajeCedula(null);
    setMostrarFormulario(false);

    if (!validarCedula(form.cedula)) {
      setMensajeCedula("Cédula inválida");
      setBloquearNombre(false);
      setTimeout(() => cedulaRef.current?.focus(), 0);
      return;
    }

    try {
      const res = await apiFetch(`${API_USUARIOS}/cedula/${form.cedula}`);

      if (res.ok) {
        const usuario = await res.json();

        setForm((prev) => ({
          ...prev,
          nombres: usuario.nombres || "",
          tipoUsuario: usuario.tipoUsuario || "",
          correo: usuario.correo || "",
        }));

        setBloquearNombre(true);
        setBloquearCorreo(true); // 🔥 BLOQUEA CORREO
        setUsuarioAceptoAcuerdo(usuario.aceptaAcuerdo === true);
      } else {
        setBloquearNombre(false);
        setBloquearCorreo(false); // 🔥 DESBLOQUEA
        setForm((prev) => ({
          ...prev,
          nombres: "",
          correo: "",
        }));
      }

      setMostrarFormulario(true);
    } catch {
      setMensajeCedula("Error al consultar usuario");
    }
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
        name === "numeroPersonas"
          ? Number(value)
          : name === "nombres" || name === "nombreInstitucion"
            ? value.toUpperCase()
            : value,
    }));
  };

  const nombreCompletoValido = (nombre: string) => {
    const partes = nombre.trim().split(/\s+/);
    return partes.length >= 2 && partes[0].length >= 2 && partes[1].length >= 2;
  };

  const formularioValido = () => {
    if (user) {
      return (
        form.nombreInstitucion?.trim() &&
        form.nombreArea &&
        form.numeroPersonas >= 1 &&
        form.numeroPersonas <= maxPersonas &&
        form.fecha &&
        form.horaInicio &&
        form.horaFin &&
        !solapada(form.horaInicio, form.horaFin, horasBloqueadas)
      );
    }

    return (
      validarCedula(form.cedula) &&
      (bloquearNombre || nombreCompletoValido(form.nombres)) &&
      form.tipoUsuario &&
      form.correo?.trim() &&
      form.nombreInstitucion?.trim() &&
      form.nombreArea &&
      form.numeroPersonas >= 1 &&
      form.numeroPersonas <= maxPersonas &&
      form.fecha &&
      form.horaInicio &&
      form.horaFin &&
      !solapada(form.horaInicio, form.horaFin, horasBloqueadas)
    );
  };

  const enviarReserva = async (acepta: boolean) => {
    const payload = {
      ...form,
      aceptaAcuerdo: acepta,
    };

    const token = localStorage.getItem("token");

    //const res = await apiFetch(API_RESERVAS, {
    try {
      const res = await apiFetch(`${API_RESERVAS}/reservar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(payload),
    });

      setReservaCreada(await res.json());
      setMostrarModal(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "No se pudo crear la reserva",
      );
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
      setError("Horario permitido de 08:00 a 16:30");
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

    if (user?.aceptaAcuerdo || usuarioAceptoAcuerdo) {
      await enviarReserva(true);
    } else {
      setMostrarModal(true);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="reservation-page">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Coworking</span>
        <h2>Reserva pública de espacios</h2>
        <p>
          Complete sus datos, seleccione el área y confirme su ingreso desde un
          flujo visual más claro para usuarios públicos e institucionales.
        </p>
      </div>

      <div className="reserva-layout">
        {!user && (
          <div className="video-panel">
            <video
              src="./videos/coworking.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        )}

        <div className="reserva-content">
          <div className="form-panel">
            <>
              {!reservaCreada && (
                <form onSubmit={handleSubmit} noValidate>
                  {!user && (
                    <div className="reservation-centered-field">
                      <label>Cédula</label>

                      <input
                        ref={cedulaRef}
                        name="cedula"
                        value={form.cedula}
                        maxLength={10}
                        onChange={handleChange}
                        onBlur={validarCedulaBlur}
                      />

                      {mensajeCedula && (
                        <p className="error span-2">{mensajeCedula}</p>
                      )}
                    </div>
                  )}

                  {(mostrarFormulario || user) && (
                    <div
                      className={`fade-in form-grid-2 ${
                        reseteando ? "fade-out" : ""
                      }`}
                    >
                      {!user && (
                        <>
                          <div className="field span-2">
                            <label>Nombres</label>
                            <input
                              name="nombres"
                              value={form.nombres}
                              disabled={bloquearNombre}
                              onChange={handleChange}
                            />

                            {!bloquearNombre &&
                              form.nombres &&
                              !nombreCompletoValido(form.nombres) && (
                                <p className="error">
                                  Debe ingresar al menos un nombre y un apellido
                                </p>
                              )}

                            <label>Correo Persona</label>
                            <input
                              name="correo"
                              type="email"
                              placeholder="Correo personal"
                              value={form.correo}
                              disabled={bloquearCorreo}
                              onChange={handleChange}
                            />
                          </div>

                          <div className="field">
                            <label>Tipo usuario</label>
                            <select
                              name="tipoUsuario"
                              value={form.tipoUsuario}
                              disabled={!!form.tipoUsuario}
                              onChange={handleChange}
                            >
                              <option value="">Seleccione</option>
                              <option value="PRIVADO">PRIVADO</option>
                              <option value="ESTUDIANTE">ESTUDIANTE</option>
                              <option value="SERVIDOR_PUBLICO">
                                SERVIDOR PUBLICO
                              </option>
                              <option value="SERVIDOR_AZVCH">
                                SERVIDOR AZVCH
                              </option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* 🔹 DESDE AQUÍ TODOS VEN */}
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
                              numeroPersonas: 1,
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

                      {form.nombreArea && (
                        <div className="field span-2">
                          <label htmlFor="numeroPersonas">
                            {form.nombreArea === "SALA_REUNIONES"
                              ? "Personas en la reunión (máximo 9)"
                              : "Puestos a reservar (máximo 4)"}
                          </label>
                          <input
                            id="numeroPersonas"
                            name="numeroPersonas"
                            type="number"
                            min={1}
                            max={maxPersonas}
                            value={form.numeroPersonas}
                            onChange={handleChange}
                          />
                        </div>
                      )}

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
                          min={fechaActualLocal()}
                          onKeyDown={(e) => e.preventDefault()} // evita escribir manual
                          onFocus={(e) => e.target.showPicker?.()}
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
                          {generarBloques(HORA_MIN, HORA_MAX, true).map((hora) => {
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
                                disabled={
                                  hora === HORA_MAX
                                    ? !horaInicioSel
                                    : cuposDisponibles <
                                      (form.nombreArea === "SALA_REUNIONES"
                                        ? 1
                                        : form.numeroPersonas)
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
                                <span className="cupos-mini">
                                  {cuposDisponibles}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {horaInicioSel && horaFinSel && (
                          <p className="hint">
                            Horario seleccionado:{" "}
                            <strong>{horaInicioSel}</strong> –{" "}
                            <strong>{horaFinSel}</strong>
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
                  )}
                </form>
              )}

              <AcuerdoResponsabilidadModal
                open={mostrarModal}
                onClose={() => setMostrarModal(false)}
                onAccept={() => enviarReserva(true)}
              />

              {(mostrarFormulario || user) &&
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
                <div className="reservation-summary">
                  <div className="reservation-summary__card" ref={qrRef}>
                    <h3>Tu código de acceso</h3>

                    <p className="reservation-summary__meta">
                      Gracias por confiar en la{" "}
                      <b>Administración Zonal Valle de los Chillos</b>.
                    </p>

                    <p className="reservation-summary__meta">
                      Su reserva es para el día <b>{reservaCreada.fecha}</b>
                      <br />
                      en el horario de <b>{reservaCreada.horaInicio}</b> a{" "}
                      <b>{reservaCreada.horaFin}</b>
                    </p>

                    <p className="reservation-summary__meta">
                      Código de validación:
                    </p>

                    <QRCodeCanvas
                      value={`${reservaCreada.qrToken}`}
                      size={220}
                    />

                    <p className="reservation-summary__code">
                      {reservaCreada.qrToken}
                    </p>

                    <p className="reservation-summary__code">
                      Presente este código al momento de su ingreso.
                    </p>
                  </div>
                  <div className="reservation-summary__actions">
                    <button className="btn" onClick={imprimirQR}>
                      Imprimir QR
                    </button>
                    <button className="btn" onClick={nuevaReserva}>
                      Nueva reserva
                    </button>
                  </div>
                  {errorImpresion && (
                    <p className="error">{errorImpresion}</p>
                  )}
                </div>
              )}
            </>
          </div>
        </div>
      </div>
    </div>
  );
}
