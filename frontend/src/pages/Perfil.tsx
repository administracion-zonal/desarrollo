import { useEffect, useState } from "react";
import incognito from "../assets/incognito-ini.jpg";
import ImageCropper from "../components/ImageCropper";
import { useAuth } from "../context/useAuth";
import type { PerfilUsuario } from "../types/PerfilUsuario";
import { apiFetch } from "../utils/api";

export default function Perfil() {
  const { user } = useAuth();

  const [editando, setEditando] = useState(false);
  const esInstitucional =
    user?.roles.includes("SERVIDOR_AZVCH") || user?.roles.includes("ADMIN");
  const [imagenTemporal, setImagenTemporal] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);

  const fotoUrl = user?.fotoPerfil
    ? `${import.meta.env.VITE_API_URL}/${user.fotoPerfil}?v=${cacheBust}`
    : incognito;

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [modalPass, setModalPass] = useState(false);

  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorPass, setErrorPass] = useState("");

  useEffect(() => {
    const cargarPerfil = async () => {
      const res = await apiFetch(`/api/usuarios/perfil/${user?.idUsuario}`);

      if (!res.ok) return;

      const data = await res.json();

      setPerfil(data);
    };

    if (user?.idUsuario) {
      cargarPerfil();
    }
  }, [user]);

  const validarPassword = () => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordActual) {
      setErrorPass("Ingrese la contraseña actual");
      return false;
    }

    if (!regex.test(passwordNueva)) {
      setErrorPass(
        "Debe tener mínimo 8 caracteres, mayúscula, minúscula y número",
      );
      return false;
    }

    if (passwordNueva !== confirmPassword) {
      setErrorPass("Las contraseñas no coinciden");
      return false;
    }

    setErrorPass("");
    return true;
  };

  const cumple = {
    length: passwordNueva.length >= 8,
    mayus: /[A-Z]/.test(passwordNueva),
    minus: /[a-z]/.test(passwordNueva),
    num: /\d/.test(passwordNueva),
  };

  return (
    <div className="perfil-container">
      <div className="perfil-header">
        {/* FOTO Y BOTÓN */}
        <div className="perfil-foto-container">
          <img src={fotoUrl} className="perfil-foto" alt="" />

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
            <button onClick={() => setModalPass(true)} className="btn-warning">
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>

      {/******************************************************************************************** */}

      {/* =========================
          MODAL EDITAR
      ========================= */}

      {/*{editando && (
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
      )}*/}

      {editando && perfil && (
        <div className="modal-overlay">
          <div className="modal">
            {/* HEADER */}
            <div className="modal-header">Actualizar datos</div>

            {/* BODY */}
            <div className="field">
              <label>Nombres</label>

              <input
                readOnly
                value={perfil.nombres || ""}
                onChange={(e) =>
                  setPerfil((prev) =>
                    prev ? { ...prev, nombres: e.target.value } : prev,
                  )
                }
              />

              {/* 🔽 GRID DE 2 COLUMNAS */}
              {!esInstitucional && (
                <div className="grid-2">
                  <div>
                    <label>Correo</label>
                    <input
                      readOnly
                      value={perfil.correo || ""}
                      onChange={(e) =>
                        setPerfil((prev) =>
                          prev ? { ...prev, correo: e.target.value } : prev,
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>Institución</label>
                    <input
                      value={perfil.institucion || ""}
                      onChange={(e) =>
                        setPerfil((prev) =>
                          prev
                            ? { ...prev, institucion: e.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {esInstitucional && (
                <>
                  <label>Dirección</label>
                  <input
                    readOnly
                    value={perfil.direccion || ""}
                    onChange={(e) =>
                      setPerfil((prev) =>
                        prev ? { ...prev, direccion: e.target.value } : prev,
                      )
                    }
                  />

                  <label>Cargo</label>
                  <input
                    readOnly
                    value={perfil.cargo || ""}
                    onChange={(e) =>
                      setPerfil((prev) =>
                        prev ? { ...prev, cargo: e.target.value } : prev,
                      )
                    }
                  />
                  <label>Unidad</label>
                  <input
                    readOnly
                    value={perfil.unidad || ""}
                    onChange={(e) =>
                      setPerfil((prev) =>
                        prev ? { ...prev, unidad: e.target.value } : prev,
                      )
                    }
                  />

                  <div className="grid-2">
                    <div>
                      <label>Correo institucional</label>
                      <input
                        readOnly
                        value={perfil.correoInstitucional || ""}
                        onChange={(e) =>
                          setPerfil((prev) =>
                            prev
                              ? { ...prev, correoInstitucional: e.target.value }
                              : prev,
                          )
                        }
                      />
                    </div>
                    <div>
                      <label>Extensión</label>
                      <input
                        value={perfil.telefonoExtension || ""}
                        onChange={(e) =>
                          setPerfil((prev) =>
                            prev
                              ? { ...prev, telefonoExtension: e.target.value }
                              : prev,
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={async () => {
                  const res = await apiFetch(`/api/usuarios/actualizar`, {
                    method: "PUT",
                    body: JSON.stringify(perfil),
                  });

                  if (res.ok) {
                    alert("Datos actualizados ✅");
                    setEditando(false);
                  } else {
                    alert("Error al actualizar");
                  }
                }}
              >
                Guardar cambios
              </button>

              <button
                className="btn-secondary"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </button>
            </div>
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
              `/api/usuarios/subir-foto/${user?.idUsuario}`,
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

      {modalPass && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">Cambiar contraseña</div>

            <div className="field">
              {/* 🔐 ACTUAL */}
              <label>Contraseña actual</label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Contraseña actual"
              />

              {/* 🔐 NUEVA */}
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Nueva contraseña"
              />

              <small style={{ fontSize: "12px", color: "#64748b" }}>
                Mínimo 8 caracteres, mayúscula, minúscula y número
              </small>

              {/* 🔐 CONFIRMAR */}
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
              />

              {errorPass && (
                <span style={{ color: "red", fontSize: "13px" }}>
                  {errorPass}
                </span>
              )}

              <ul style={{ fontSize: "12px" }}>
                <li style={{ color: cumple.length ? "green" : "red" }}>
                  Mínimo 8 caracteres
                </li>
                <li style={{ color: cumple.mayus ? "green" : "red" }}>
                  Una mayúscula
                </li>
                <li style={{ color: cumple.minus ? "green" : "red" }}>
                  Una minúscula
                </li>
                <li style={{ color: cumple.num ? "green" : "red" }}>
                  Un número
                </li>
              </ul>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!validarPassword()) return;

                  const res = await apiFetch("/api/usuarios/cambiar-password", {
                    method: "PUT",
                    body: JSON.stringify({
                      passwordActual,
                      passwordNueva,
                    }),
                  });

                  if (res.ok) {
                    alert("Contraseña actualizada ✅");

                    setModalPass(false);
                    setPasswordActual("");
                    setPasswordNueva("");
                    setConfirmPassword("");
                  } else {
                    setErrorPass("Error al actualizar contraseña");
                  }
                }}
              >
                Guardar
              </button>

              <button onClick={() => setModalPass(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
