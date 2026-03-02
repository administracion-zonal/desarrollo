import { useState } from "react";

export default function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const cambiarPassword = async () => {
    setError("");
    setMensaje("");

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:8083/api/auth/cambiar-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            passwordActual,
            passwordNueva,
          }),
        },
      );

      const texto = await res.text(); // 🔥 SOLO UNA VEZ

      if (res.ok) {
        setMensaje(texto);
        setPasswordActual("");
        setPasswordNueva("");
        setConfirmarPassword("");
      } else {
        setError(texto);
      }
    } catch {
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2>Cambiar contraseña</h2>

        <input
          type="password"
          placeholder="Contraseña actual"
          value={passwordActual}
          onChange={(e) => setPasswordActual(e.target.value)}
        />

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={passwordNueva}
          onChange={(e) => setPasswordNueva(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirmarPassword}
          onChange={(e) => setConfirmarPassword(e.target.value)}
        />

        <button onClick={cambiarPassword} className="btn-primary">
          Cambiar contraseña
        </button>

        {mensaje && (
          <p style={{ color: "#00e676", marginTop: "10px" }}>{mensaje}</p>
        )}

        {error && (
          <p style={{ color: "#ff5252", marginTop: "10px" }}>{error}</p>
        )}

        <p className="hint">
          La contraseña debe tener:
          <br />• Mínimo 8 caracteres
          <br />• Una mayúscula
          <br />• Una minúscula
          <br />• Un número
          <br />• Un carácter especial
        </p>
      </div>
    </div>
  );
}
