import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="menu">
      <Link to="/perfil">Perfil</Link>

      {user.roles.includes("ADMIN") && <Link to="/dashboard">Dashboard</Link>}

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
