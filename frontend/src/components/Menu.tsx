import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.roles?.includes("ADMIN");

  const isAdminCoworking = user.roles?.includes("ADMIN_COWORKING");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="menu">
      <Link to="/perfil">Perfil</Link>

      {/* 🔥 ADMIN GENERAL */}
      {isAdmin && (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin/reservas">Administrar Reservas</Link>
          <Link to="/admin/vehiculos">Vehículos</Link>
        </>
      )}

      {/* 🔥 ADMIN SOLO COWORKING */}
      {isAdminCoworking && (
        <div className="menu-item">
          <span>Admin Coworking ▾</span>

          <div className="submenu">
            <Link to="/admin/coworking/reservas">Administrar Coworking</Link>
          </div>
        </div>
      )}

      {/* 🔥 USUARIOS */}
      <Link to="/mis-reservas">Mis reservas</Link>

      <div className="menu-item">
        <span>Reservas ▾</span>

        <div className="submenu">
          <Link to="/reservas/coworking">Coworking</Link>
        </div>
      </div>

      <button onClick={handleLogout}>Cerrar sesión</button>
    </nav>
  );
}
