import { useEffect, useState, useRef } from "react";
import type { Reserva } from "../types/Reserva";
import { QRCodeCanvas } from "qrcode.react";
import { validarCedula } from "../utils/validaciones";
import "../App.css";

const API_URL = "http://localhost:8083/api/reservas";
const API_USUARIOS = "http://localhost:8083/api/usuarios/cedula";

const initialForm = {
  cedula: "",
  nombres: "",
  tipoUsuario: "",
  nombreInstitucion: "",
  fecha: "",
  horaInicio: "",
  horaFin: "",
  nombreArea: "",
};

export default function ReservaForm() {
  const [form, setForm] = useState(initialForm);
  const [bloquearNombre, setBloquearNombre] = useState(false);
  const [mensajeCedula, setMensajeCedula] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cupos, setCupos] = useState<number | null>(null);
  const [horasBloqueadas, setHorasBloqueadas] = useState<string[]>([]);
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

  const cedulaRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = "http://localhost:8083";

  const HORA_MIN = "08:00";
  const HORA_MAX = "16:00";

  const areaImages: Record<string, string> = {
    SALA_REUNIONES: `${BACKEND_URL}/areas/SALA_REUNIONES.jpeg`,
    TRABAJO_INDIVIDUAL: `${BACKEND_URL}/areas/TRABAJO_INDIVIDUAL.jpeg`,
    COMPARTIDO_A: `${BACKEND_URL}/areas/COMPARTIDO_A.jpeg`,
    COMPARTIDO_B: `${BACKEND_URL}/areas/COMPARTIDO_B.jpeg`,
  };

  /* ================= VALIDAR CÉDULA ================= */
  const validarCedulaBlur = async () => {
    setMensajeCedula(null);

    if (!validarCedula(form.cedula)) {
      setMensajeCedula("Cédula inválida");
      setForm((prev) => ({ ...prev, nombres: "" }));
      setBloquearNombre(false);
      setMostrarFormulario(false);
      setTimeout(() => {
        cedulaRef.current?.focus();
      }, 0);
      return;
    }
    setMostrarFormulario(true);
    try {
      const res = await fetch(`${API_USUARIOS}/${form.cedula}`);

      if (res.ok) {
        const usuario = await res.json();
        setForm((prev) => ({ ...prev, nombres: usuario.nombres }));
        setBloquearNombre(true);
      } else {
        setForm((prev) => ({ ...prev, nombres: "" }));
        setBloquearNombre(false);
      }
    } catch {
      setMensajeCedula("Error al consultar usuario");
      setTimeout(() => {
        cedulaRef.current?.focus();
      }, 0);
    }
  };

  /* ================= DISPONIBILIDAD ================= */
  useEffect(() => {
    if (!form.nombreArea || !form.fecha) return;

    fetch(
      `${API_URL}/disponibilidad?nombreArea=${form.nombreArea}&fecha=${form.fecha}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setCupos(data.disponibles);
        setHorasBloqueadas(
          data.reservas.map(
            (r: { horaInicio: string; horaFin: string }) =>
              `${r.horaInicio}-${r.horaFin}`,
          ),
        );
      })
      .catch(() => {
        setCupos(null);
        setHorasBloqueadas([]);
      });
  }, [form.nombreArea, form.fecha]);

  /* ================= HANDLERS ================= */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "nombreArea" || name === "fecha") {
      setCupos(null);
      setHorasBloqueadas([]);
    }

    if (name === "fecha" && value && !esDiaHabil(value)) {
      alert("Solo se permiten reservas de lunes a viernes");
      return;
    }
  };

  const solapada = (inicio: string, fin: string) =>
    horasBloqueadas.some((h) => {
      const [hi, hf] = h.split("-");
      return inicio < hf && fin > hi;
    });

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validarCedula(form.cedula)) {
      setError("Cédula inválida");
      setMensajeCedula("Cédula inválida");

      setTimeout(() => {
        cedulaRef.current?.focus();
      }, 0);
      return;
    }

    if (form.horaInicio < HORA_MIN || form.horaFin > HORA_MAX) {
      setError("Horario permitido de 08:00 a 16:00");
      return;
    }

    if (form.horaInicio < HORA_MIN || form.horaFin > HORA_MAX) {
      setError("El horario permitido es de 08:00 a 16:00");
      return;
    }

    if (form.horaFin <= form.horaInicio) {
      setError("La hora fin debe ser mayor a la hora inicio");
      return;
    }

    if (solapada(form.horaInicio, form.horaFin)) {
      setError("Horario no disponible");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setError("Error al registrar la reserva");
        return;
      }

      const data: Reserva = await response.json();
      setReservaCreada(data);
    } catch {
      setError("Error de conexión con el servidor");
    }
  };

  const nuevaReserva = () => {
    setReservaCreada(null);
    setForm(initialForm);
    setBloquearNombre(false);
    setCupos(null);
    setHorasBloqueadas([]);
    setError(null);
    setMensajeCedula(null);
  };

  const esDiaHabil = (fecha: string) => {
    const dia = new Date(fecha + "T00:00:00").getDay();
    return dia !== 0 && dia !== 6; // 0 domingo, 6 sábado
  };

  const formularioValido = () => {
    return (
      validarCedula(form.cedula) &&
      form.nombres.trim() !== "" &&
      form.tipoUsuario !== "" &&
      form.nombreInstitucion.trim() !== "" &&
      form.nombreArea !== "" &&
      form.fecha !== "" &&
      form.horaInicio !== "" &&
      form.horaFin !== "" &&
      !solapada(form.horaInicio, form.horaFin)
    );
  };

  /* ================= UI ================= */
  return (
    <>
      <h2 style={{ textAlign: "center" }}>Reserva Coworking</h2>

      {!reservaCreada && (
        <form onSubmit={handleSubmit} className="form-grid" noValidate>
          <label>Cédula:</label>
          <input
            ref={cedulaRef}
            name="cedula"
            value={form.cedula}
            maxLength={10}
            onChange={handleChange}
            onBlur={validarCedulaBlur}
          />
          <div />
          <label></label>
          {mensajeCedula && (
            <p className="error" style={{ marginTop: "-10px" }}>
              {mensajeCedula}
            </p>
          )}

          {mostrarFormulario && (
            <div className="fade-in form-grid-2">
              {/* NOMBRES */}
              <div className="field span-2">
                <label>Nombres</label>
                <input
                  name="nombres"
                  value={form.nombres}
                  disabled={bloquearNombre}
                  onChange={handleChange}
                />
              </div>

              {/* ÁREA */}
              <div className="field">
                <label>Área</label>
                <select
                  name="nombreArea"
                  value={form.nombreArea}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>
                  <option value="SALA_REUNIONES">Sala reuniones</option>
                  <option value="TRABAJO_INDIVIDUAL">Trabajo individual</option>
                  <option value="COMPARTIDO_A">Zona compartida A</option>
                  <option value="COMPARTIDO_B">Zona compartida B</option>
                </select>
              </div>

              {/* TIPO USUARIO */}
              <div className="field">
                <label>Tipo usuario</label>
                <select
                  name="tipoUsuario"
                  value={form.tipoUsuario}
                  onChange={handleChange}
                >
                  <option value="">Seleccione</option>
                  <option value="PUBLICO">Público</option>
                  <option value="PRIVADO">Privado</option>
                  <option value="ESTUDIANTE">Estudiante</option>
                </select>
              </div>

              {/* INSTITUCIÓN */}
              <div className="field span-2">
                <label>Institución</label>
                <input
                  name="nombreInstitucion"
                  value={form.nombreInstitucion}
                  onChange={handleChange}
                />
              </div>

              {/* FECHA */}
              <div className="field span-2">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* CUPOS */}
              <div className="field span-2 cupos">
                {cupos !== null && (
                  <p>
                    <strong>Cupos disponibles:</strong> {cupos}
                  </p>
                )}
              </div>

              {/* HORA INICIO */}
              <div className="field">
                <label>Hora inicio</label>
                <input
                  type="time"
                  name="horaInicio"
                  value={form.horaInicio}
                  step="900"
                  onChange={handleChange}
                />
                <small className="hint">08:00 – 16:00</small>
              </div>

              {/* HORA FIN */}
              <div className="field">
                <label>Hora fin</label>
                <input
                  type="time"
                  name="horaFin"
                  value={form.horaFin}
                  onChange={handleChange}
                />
                <small className="hint">08:01 – 16:00</small>
              </div>

              {/* BOTÓN */}
              <div className="actions span-2">
                <button className="btn" disabled={!formularioValido()}>
                  Reservar
                </button>
              </div>

              {error && <p className="error full">{error}</p>}
            </div>
          )}
        </form>
      )}

      {mostrarFormulario &&
        !reservaCreada &&
        form.nombreArea &&
        areaImages[form.nombreArea] && (
          <div className="area-preview">
            <img src={areaImages[form.nombreArea]} alt={form.nombreArea} />
          </div>
        )}

      {reservaCreada && (
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <h3>Tu código de acceso</h3>

          <QRCodeCanvas value={`RESERVA|${reservaCreada.qrToken}`} size={220} />

          <p>Guarda este código, se mostrará solo una vez</p>

          <button className="btn" onClick={nuevaReserva}>
            Nueva reserva
          </button>
        </div>
      )}
    </>
  );
}
