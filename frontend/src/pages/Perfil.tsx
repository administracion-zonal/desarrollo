import { useAuth } from "../context/useAuth";
import { useState, useEffect } from "react";
import incognito from "../assets/incognito-ini.jpg";
import ImageCropper from "../components/ImageCropper";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import type { PerfilUsuario } from "../types/PerfilUsuario";

export default function Perfil() {
  const { user } = useAuth();

  const [editando, setEditando] = useState(false);
  const esInstitucional =
    user?.roles.includes("SERVIDOR_AZVCH") || user?.roles.includes("ADMIN");
  const [imagenTemporal, setImagenTemporal] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);
  const navigate = useNavigate();
  const fotoUrl = user?.fotoPerfil
    ? `${import.meta.env.VITE_API_URL}/${user.fotoPerfil}?v=${cacheBust}`
    : incognito;

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      const res = await apiFetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/perfil/${user?.idUsuario}`,
      );

      if (!res.ok) return;

      const data = await res.json();

      setPerfil(data);
    };

    if (user?.idUsuario) {
      cargarPerfil();
    }
  }, [user]);

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        {/* FOTO Y BOTÓN */}
        <div className="perfil-foto-container">
          <img src={fotoUrl} className="perfil-foto" />

          <label className="perfil-boton-foto">
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = () => {
                  setImagenTemporal(reader.result as string);
                };

                reader.readAsDataURL(file);
              }}
              hidden
            />
          </label>
        </div>

        {/* INFO DERECHA */}
        <div className="perfil-info-container">
          <h2 className="perfil-nombre">{perfil?.nombres || user?.nombres}</h2>
          <p>
            {user?.roles.includes("ADMIN")
              ? "ADMIN"
              : user?.roles.includes("SERVIDOR_AZVCH")
                ? "SERVIDOR"
                : user?.roles.includes("ESTUDIANTE")
                  ? "ESTUDIANTE"
                  : "PRIVADO"}
          </p>
        </div>
      </div>

      {/******************************************************************************************** */}

      <div className="perfil-layout">
        {/* IZQUIERDA — 80% */}
        <div className="perfil-col-izquierda">
          <div className="perfil-card">
            <h3>INFORMACIÓN PERSONAL</h3>

            {!esInstitucional && (
              <>
                <div className="perfil-item">
                  <label>Correo</label>
                  <span>{perfil?.correo}</span>
                </div>

                <div className="perfil-item">
                  <label>Institución</label>
                  <span>{perfil?.institucion}</span>
                </div>
              </>
            )}

            {esInstitucional && (
              <>
                <div className="perfil-item">
                  <label>Direeción</label>
                  <span>{perfil?.direccion}</span>
                </div>

                <div className="perfil-item">
                  <label>Cargo</label>
                  <span>{perfil?.cargo}</span>
                </div>

                <div className="perfil-item">
                  <label>Unidad</label>
                  <span>{perfil?.unidad}</span>
                </div>

                <div className="perfil-item">
                  <label>Correo institucional</label>
                  <span>{perfil?.correoInstitucional}</span>
                </div>

                <div className="perfil-item">
                  <label>Extensión</label>
                  <span>{perfil?.telefonoExtension}</span>
                </div>
              </>
            )}

            <button onClick={() => setEditando(true)} className="btn-primary">
              Actualizar datos
            </button>
          </div>
        </div>

        {/* DERECHA — 20% */}
        <div className="perfil-col-derecha">
          <div className="perfil-card">
            <button
              onClick={() => navigate("/cambiar-password")}
              className="btn-warning"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>

      {/******************************************************************************************** */}

      {/* =========================
          MODAL EDITAR
      ========================= */}

      {editando && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Actualizar datos</h3>

            <input placeholder="Nombres" />

            <input placeholder="Correo" />

            <input placeholder="Institución" />

            <button className="btn-primary">Guardar cambios</button>

            <button
              onClick={() => setEditando(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {imagenTemporal && (
        <ImageCropper
          image={imagenTemporal}
          onCancel={() => setImagenTemporal(null)}
          onComplete={async (blob) => {
            const formData = new FormData();

            formData.append(
              "file",
              new File([blob], "perfil.jpg", { type: "image/jpeg" }),
            );

            const res = await apiFetch(
              `${import.meta.env.VITE_API_URL}/api/usuarios/subir-foto/${user?.idUsuario}`,
              {
                method: "POST",
                body: formData,
              },
            );

            if (!res.ok) {
              alert("Error subiendo foto");
              return;
            }

            const ruta = await res.text();

            localStorage.setItem("fotoPerfil", ruta);

            setCacheBust((prev) => prev + 1);
            setImagenTemporal(null);
          }}
        />
      )}
    </div>
  );
}
