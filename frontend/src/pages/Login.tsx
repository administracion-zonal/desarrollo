import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula, password }),
        },
      );

      if (!res.ok) {
        setError("Credenciales incorrectas");
        return;
      }

      const data = await res.json();

      console.log("RESPUESTA LOGIN 👉", data);

      // 🔐 Guardar sesión

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      setUser(data);

      // 🚦 REDIRECCIÓN
      if (data.debeCambiarPassword) {
        navigate("/cambiar-password", { replace: true });
        return;
      }

      if (!data.aceptaAcuerdo) {
        navigate("/reservas/coworking", { replace: true });
        return;
      }

      navigate("/perfil", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={submit}>
        <h2>Iniciar sesión</h2>

        <input
          maxLength={10}
          placeholder="Cédula"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Ingresar</button>

        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
