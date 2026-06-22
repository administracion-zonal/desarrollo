import { useState } from "react";
import { apiFetch } from "../utils/api";

const API = `/talento-humano`;

export default function GestionTH() {
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setOk(null);

    if (!cedula || !nombres) {
      setError("Ingrese cédula y nombres");
      return;
    }

    try {
      setLoading(true);

      const res = await apiFetch(`${API}/crear-o-activar`, {
        method: "POST",
        body: JSON.stringify({ cedula, nombres }),
      });

      if (res.ok) {
        setOk("✅ Usuario creado correctamente");
      } else {
        const txt = await res.text();
        setError(txt);
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="reservation-shell">
      <h2 className="page-title">Gestión Talento Humano</h2>

      <div className="reservation-panel">
        <div className="reserva-content">
          <div className="form-grid-2" style={{ maxWidth: "920px" }}>
            <form onSubmit={crearUsuario}>
              {/* CÉDULA */}
              <div className="field span-2">
                <label>Cédula</label>
                <input
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ingrese cédula"
                />
              </div>

              {/* NOMBRES */}
              <div className="field span-2">
                <label>Nombres</label>
                <input
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ingrese nombres"
                />
              </div>

              {/* BOTÓN */}
              <button className="btn-primary" disabled={loading}>
                {loading ? "Creando..." : "Crear / Activar Usuario"}
              </button>

              {/* MENSAJES */}
              {error && <p className="error">{error}</p>}
              {ok && <p style={{ color: "green" }}>{ok}</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
