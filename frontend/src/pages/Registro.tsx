import { useState } from "react";
import {
  validarCedula,
  validarCorreo,
  validarPassword,
} from "../utils/validaciones";
import AcuerdoResponsabilidadModal from "../components/modals/AcuerdoResponsabilidadModal";
import { apiFetch } from "../utils/api";

const API = `${import.meta.env.VITE_API_URL}/api/auth/register`;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

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

    // CÉDULA → SOLO NÚMEROS
    if (name === "cedula") {
      value = value.replace(/\D/g, "");
    }

    // NOMBRES → SOLO LETRAS Y MAYÚSCULAS
    if (name === "nombres") {
      value = value.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").toUpperCase();
    }

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
  };

  /* =========================
     SUBMIT FORM
  ========================= */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    if (!validarCedula(form.cedula)) {
      setError("❌ Cédula inválida");
      return;
    }

    if (!validarCorreo(form.correo)) {
      setError("❌ Correo inválido");
      return;
    }

    if (form.password.length < 8) {
      setError("❌ La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!validarPassword(form.password)) {
      setError(
        "❌ Password debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo",
      );
      return;
    }

    if (form.password !== form.confirmarPassword) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

    // 🔥 ABRIR MODAL
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

        <input
          name="nombres"
          value={form.nombres}
          placeholder="Nombres"
          onChange={handleChange}
        />

        <input
          name="correo"
          type="email"
          placeholder="Correo personal"
          value={form.correo}
          onChange={handleChange}
        />

        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />

        <input
          name="confirmarPassword"
          type="password"
          placeholder="Confirmar contraseña"
          value={form.confirmarPassword}
          onChange={handleChange}
        />

        <button type="submit">Registrarse</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
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
