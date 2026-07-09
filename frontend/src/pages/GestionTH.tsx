import { useState } from "react";
import { apiFetch } from "../utils/api";

const API = `/talento-humano`;

export default function GestionTH() {
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [cedulaDesbloqueo, setCedulaDesbloqueo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [errorDesbloqueo, setErrorDesbloqueo] = useState<string | null>(null);
  const [okDesbloqueo, setOkDesbloqueo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDesbloqueo, setLoadingDesbloqueo] = useState(false);

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setOk(null);

    if (!cedula || !nombres) {
      setError("Ingrese cedula y nombres");
      return;
    }

    try {
      setLoading(true);

      await apiFetch(`${API}/crear-o-activar`, {
        method: "POST",
        body: JSON.stringify({ cedula, nombres }),
      });

      setOk("Usuario creado correctamente");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Error de conexion con el servidor",
      );
    } finally {
      setLoading(false);
    }
  };

  const desbloquearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorDesbloqueo(null);
    setOkDesbloqueo(null);

    if (!cedulaDesbloqueo) {
      setErrorDesbloqueo("Ingrese cedula a desbloquear");
      return;
    }

    try {
      setLoadingDesbloqueo(true);

      await apiFetch(`/usuarios/${cedulaDesbloqueo}/desbloquear`, {
        method: "PUT",
      });

      setOkDesbloqueo("Usuario desbloqueado correctamente");
      setCedulaDesbloqueo("");
    } catch (e) {
      setErrorDesbloqueo(
        e instanceof Error ? e.message : "Error de conexion con el servidor",
      );
    } finally {
      setLoadingDesbloqueo(false);
    }
  };

  return (
    <div className="reservation-page">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Talento humano</span>
        <h2>Gestión de usuarios</h2>
        <p>
          Cree o reactive accesos institucionales desde un formulario simple y
          alineado con el resto del sistema.
        </p>
      </div>

      <div className="reserva-layout reserva-layout--compact">
        <div className="reserva-content">
          <div className="form-panel form-panel--narrow flow-stack">
            <div className="form-grid-2">
              <form onSubmit={crearUsuario}>
                <div className="field span-2">
                  <label>Cedula</label>
                  <input
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ingrese cedula"
                  />
                </div>

                <div className="field span-2">
                  <label>Nombres</label>
                  <input
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Ingrese nombres"
                  />
                </div>

                <button className="actions span-2" disabled={loading}>
                  {loading ? "Creando..." : "Crear / Activar Usuario"}
                </button>

                {error && <p className="error span-2">{error}</p>}
                {ok && <p className="success-message span-2">{ok}</p>}
              </form>
            </div>

            <div className="form-grid-2">
              <form onSubmit={desbloquearUsuario}>
                <div className="field span-2">
                  <label>Cedula bloqueada</label>
                  <input
                    value={cedulaDesbloqueo}
                    onChange={(e) => setCedulaDesbloqueo(e.target.value)}
                    placeholder="Ingrese cedula bloqueada"
                  />
                </div>

                <button className="actions span-2" disabled={loadingDesbloqueo}>
                  {loadingDesbloqueo
                    ? "Desbloqueando..."
                    : "Desbloquear Usuario"}
                </button>

                {errorDesbloqueo && (
                  <p className="error span-2">{errorDesbloqueo}</p>
                )}
                {okDesbloqueo && (
                  <p className="success-message span-2">{okDesbloqueo}</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
