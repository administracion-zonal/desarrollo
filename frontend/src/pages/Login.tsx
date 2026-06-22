import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!cedula) {
      setError("Ingresa tu cédula");
      return;
    }

    if (!password) {
      setError("Ingresa tu contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, password }),
      });

      const data = await res.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));

      if (!data.aceptaAcuerdo) {
        localStorage.setItem("tempUser", JSON.stringify(data));
        setMostrarModal(true);
        return;
      }

      setUser(data);

      if (data.debeCambiarPassword) {
        navigate("/cambiar-password", { replace: true });
        return;
      }

      navigate("/perfil", { replace: true });
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "Credenciales incorrectas");
      } else {
        setError("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const aceptarAcuerdo = async () => {
    try {
      await apiFetch("/api/usuarios/aceptar-acuerdo", {
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

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="form-footer">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>

      {/* MODAL DE ACUERDO */}
      <AcuerdoResponsabilidadModal
        open={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onAccept={aceptarAcuerdo}
      />
    </div>
  );
}
