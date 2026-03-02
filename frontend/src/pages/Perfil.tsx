import { useAuth } from "../context/useAuth";
import { useState } from "react";
import incognito from "../assets/incognito-ini.jpg";
import ImageCropper from "../components/ImageCropper";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user } = useAuth();

  const [editando, setEditando] = useState(false);

  const [imagenTemporal, setImagenTemporal] = useState<string | null>(null);
  const navigate = useNavigate();
  const fotoUrl = user?.fotoPerfil
    ? `http://localhost:8083/${user.fotoPerfil}`
    : incognito;

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
          <h2 className="perfil-nombre">{user?.nombres}</h2>

          <p className="perfil-extra">{user?.rol}</p>
        </div>
      </div>

      {/******************************************************************************************** */}

      <div className="perfil-layout">
        {/* IZQUIERDA — 80% */}
        <div className="perfil-col-izquierda">
          <div className="perfil-card">
            <h3>INFORMACIÓN PERSONAL</h3>

            <div className="perfil-item">
              <label>Nombres</label>
              <span>{user?.nombres}</span>
            </div>

            <div className="perfil-item">
              <label>Rol</label>
              <span>{user?.rol}</span>
            </div>

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

            formData.append("file", blob, "perfil.jpg");

            const res = await fetch(
              `http://localhost:8083/api/usuarios/subir-foto/${user?.id}`,
              {
                method: "POST",
                body: formData,
              },
            );

            const ruta = await res.text();

            localStorage.setItem("fotoPerfil", ruta);

            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
