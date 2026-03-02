import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-layout">
      <header className="public-header">
        {/* IZQUIERDA */}
        <div className="header-left">
          <img src="/cabecera1.png" alt="Institución" className="header-logo" />
          <div className="header-text">
            <h1>Reserva Coworking</h1>
            <span>Administración Zonal Valle de los Chillos</span>
          </div>
        </div>

        {/* DERECHA */}
        <div className="header-actions">
          <Link to="/login" className="btn-login">
            Iniciar sesión
          </Link>

          <Link to="/registro" className="btn-register">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="public-content">{children}</main>
    </div>
  );
}
