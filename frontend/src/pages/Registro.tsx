import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import AcuerdoResponsabilidadModal from "../components/modals/AcuerdoResponsabilidadModal";
import { apiFetch } from "../utils/api";
import {
  soloTexto,
  validarCedula,
  validarCorreo,
  validarPassword,
} from "../utils/validaciones";

const API = `/api/auth/register`;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    cedula: "",
    nombres: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  const [form, setForm] = useState({
    cedula: "",
    nombres: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  /* =========================
     INPUT HANDLER
  ========================= */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    let value = e.target.value;

    if (name === "cedula") {
      value = value.replace(/\D/g, "");
    }

    if (name === "nombres") {
      value = value.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").toUpperCase();
    }

    setFieldErrors((prev) => ({ ...prev, [name]: "" }));

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     REGISTRAR USUARIO
  ========================= */
  const registrarUsuario = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          aceptaAcuerdo: true,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        if (text.toLowerCase().includes("cédula")) {
          setError("❌ Cédula ya registrada");
        } else if (text.toLowerCase().includes("correo")) {
          setError("❌ Correo ya registrado");
        } else {
          setError(text);
        }
        return;
      }

      const data = JSON.parse(text);

      localStorage.setItem("token", data.token);

      setSuccess("✅ Registro exitoso. Redirigiendo...");

      setTimeout(() => {
        window.location.href = "/perfil";
      }, 1500);
    } catch (error) {
      console.error(error);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SUBMIT FORM
  ========================= */
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    const errors = {
      cedula: "",
      nombres: "",
      correo: "",
      password: "",
      confirmarPassword: "",
    };

    if (!validarCedula(form.cedula)) {
      errors.cedula = "Cédula inválida";
    }

    if (!form.nombres || form.nombres.length < 3 || !soloTexto(form.nombres)) {
      errors.nombres = "Ingresa nombres válidos";
    }

    if (!validarCorreo(form.correo)) {
      errors.correo = "Correo inválido";
    }

    if (!validarPassword(form.password)) {
      errors.password =
        "Contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo";
    }

    if (form.password !== form.confirmarPassword) {
      errors.confirmarPassword = "Las contraseñas no coinciden";
    }

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setMostrarModal(true);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={submit}>
        <h2>Registrarse</h2>

        <input
          name="cedula"
          maxLength={10}
          placeholder="Cédula"
          value={form.cedula}
          onChange={handleChange}
        />
        {fieldErrors.cedula && (
          <p className="field-error">{fieldErrors.cedula}</p>
        )}

        <input
          name="nombres"
          value={form.nombres}
          placeholder="Nombres"
          onChange={handleChange}
        />
        {fieldErrors.nombres && (
          <p className="field-error">{fieldErrors.nombres}</p>
        )}

        <input
          name="correo"
          type="email"
          placeholder="Correo personal"
          value={form.correo}
          onChange={handleChange}
        />
        {fieldErrors.correo && (
          <p className="field-error">{fieldErrors.correo}</p>
        )}

        <div className="password-field">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="field-error">{fieldErrors.password}</p>
        )}

        <input
          name="confirmarPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Confirmar contraseña"
          value={form.confirmarPassword}
          onChange={handleChange}
        />
        {fieldErrors.confirmarPassword && (
          <p className="field-error">{fieldErrors.confirmarPassword}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Procesando..." : "Registrarse"}
        </button>

        {error && <p className="login-error">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <p className="form-footer">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
        </p>
      </form>

      {/* MODAL DE ACUERDO */}
      <AcuerdoResponsabilidadModal
        open={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onAccept={registrarUsuario}
      />
    </div>
  );
}
