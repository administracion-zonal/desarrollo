import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = Readonly<{
  children: ReactNode;
}>;

export default function PublicLayout({ children }: Props) {
  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="header-left">
          <img src="/cabecera1.png" alt="Institución" className="header-logo" />
          <div className="header-text">
            <h1>Administración Zonal Valle de los Chillos</h1>
            <span>
              Reservas más claras, rápidas y consistentes para cada servicio.
            </span>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/login" className="btn-login">
            Iniciar sesión
          </Link>

          <Link to="/registro" className="btn-register">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="public-content">
        <section className="public-panel">{children}</section>
      </main>
    </div>
  );
}
