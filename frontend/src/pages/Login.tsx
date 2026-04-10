import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AcuerdoResponsabilidadModal from "../components/modals/AcuerdoResponsabilidadModal";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../utils/api";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await apiFetch(`/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, password }),
      });

      if (!res.ok) {
        setError("Credenciales incorrectas");
        return;
      }

      const data = await res.json();

      // 🔐 Guardar sesión

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      if (!data.aceptaAcuerdo) {
        localStorage.setItem("tempUser", JSON.stringify(data)); // 👈 guardar temporal
        setMostrarModal(true);
        return;
      }

      // SOLO si acepta
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);

      navigate("/perfil", { replace: true });

      // 🚦 REDIRECCIÓN
      if (data.debeCambiarPassword) {
        navigate("/cambiar-password", { replace: true });
        return;
      }

      if (!data.aceptaAcuerdo) {
        setMostrarModal(true);
        return; // 🚨 CLAVE: DETIENE TODO
      }

      navigate("/perfil", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor");
    }
  };

  const aceptarAcuerdo = async () => {
    try {
      await apiFetch("/usuarios/aceptar-acuerdo", {
        method: "POST",
      });

      // recuperar usuario temporal
      const tempUser = JSON.parse(localStorage.getItem("tempUser") || "{}");

      tempUser.aceptaAcuerdo = true;

      // guardar sesión REAL
      localStorage.setItem("token", tempUser.token);
      localStorage.setItem("user", JSON.stringify(tempUser));

      setUser(tempUser);

      localStorage.removeItem("tempUser");

      setMostrarModal(false);

      navigate("/perfil", { replace: true });
    } catch {
      setError("Error al aceptar acuerdo");
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

      {/* MODAL DE ACUERDO */}
      <AcuerdoResponsabilidadModal
        open={mostrarModal}
        onClose={() => {}}
        onAccept={aceptarAcuerdo}
      />
    </div>
  );
}
