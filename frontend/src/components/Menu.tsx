import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import { permisos } from "../utils/permisos";

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const p = permisos(user);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="menu">
      <Link to="/perfil">Perfil</Link>

      {/* ================= DASHBOARD ADMIN ================= */}
      {(p.puedeAdminCoworking || p.puedeAdminCanchas) && (
        <div className="menu-item">
          <span>Dashboard ▾</span>
          <div className="submenu">
            {p.puedeAdminCoworking && (
              <Link to="/dashboard">Admin Coworking</Link>
            )}
            {p.puedeAdminCanchas && (
              <Link to="/dashboard-cancha">Admin Cancha ⚽</Link>
            )}
            {p.puedeAdminCanchas && (
              <Link to="/admin/vehiculos">Admin Vehiculos 🚗</Link>
            )}
          </div>
        </div>
      )}

      {/* ================= MIS RESERVAS ================= */}
      <div className="menu-item">
        <span>Mis reservas ▾</span>
        <div className="submenu">
          <Link to="/mis-reservas">Coworking</Link>
          <Link to="/mis-reservas-cancha">Cancha ⚽</Link>

          {p.puedeVerVehiculos && <Link to="/vehiculos/mis">Vehículos 🚗</Link>}
        </div>
      </div>

      {/* ================= RESERVAS ================= */}
      <div className="menu-item">
        <span>Reservar ▾</span>
        <div className="submenu">
          <Link to="/reservas/coworking">Coworking</Link>
          <Link to="/cancha">Cancha ⚽</Link>

          {p.puedeVerVehiculos && (
            <Link to="/vehiculos/reservar">Vehículos 🚗</Link>
          )}
        </div>
      </div>

      {/* ================= ADMIN VEHICULOS ================= */}
      {p.puedeAdminVehiculos && (
        <div className="menu-item">
          <span>Vehículos Admin ▾</span>
          <div className="submenu">
            <Link to="/vehiculos/admin">Solicitudes</Link>
          </div>
        </div>
      )}

      {/* ================= TALENTO HUMANO ================= */}
      {p.esTalentoHumano && (
        <div className="menu-item">
          <span>👥 Talento Humano ▾</span>

          <div className="submenu">
            <Link to="/th/dashboard">📊 Panel TH</Link>

            <Link to="/gestion-th">➕ Crear / Activar Usuario</Link>

            <Link to="/th/bandeja">📥 Bandeja de Documentos</Link>
          </div>
        </div>
      )}

      <button onClick={handleLogout}>Cerrar sesión</button>
    </nav>
  );
}
