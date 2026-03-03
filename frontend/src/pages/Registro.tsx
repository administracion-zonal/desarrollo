import { useState } from "react";
import {
  validarCedula,
  validarCorreo,
  validarPassword,
} from "../utils/validaciones";
import { apiFetch } from "../utils/api";

const API = `${import.meta.env.VITE_API_URL}/api/auth/register`;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    cedula: "",
    nombres: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    let value = e.target.value;

    /* =========================
     CÉDULA → SOLO NÚMEROS
  ========================= */
    if (name === "cedula") {
      value = value.replace(/\D/g, "");
    }

    /* =========================
     NOMBRES → SOLO LETRAS Y ESPACIOS
     + CONVERTIR A MAYÚSCULAS
  ========================= */
    if (name === "nombres") {
      value = value.replace(/[^a-zA-ZÁÉÍÓÚÑáéíóúñ\s]/g, "").toUpperCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // ✅ VALIDACIONES SOLO AQUÍ
    if (!validarCedula(form.cedula)) {
      setError("❌ Cédula inválida");
      return;
    }

    if (!validarCorreo(form.correo)) {
      setError("❌ Correo inválido");
      return;
    }

    // validar contraseña mínima
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

    // validar confirmación
    if (form.password !== form.confirmarPassword) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

    const res = await apiFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      window.location.href = "/dashboard";
    }, 1500);
  };

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
    </div>
  );
}
