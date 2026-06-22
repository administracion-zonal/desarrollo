import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { permisos } from "../utils/permisos";
import { publicAssets } from "../utils/publicAssets";

type MenuSection = {
  key: string;
  label: string;
  items: Array<{
    to: string;
    label: string;
  }>;
};

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);

  if (!user) return null;

  const p = permisos(user);
  const esSoloChofer = user.roles.includes("CHOFER");

  const sections = useMemo<MenuSection[]>(() => {
    const nextSections: MenuSection[] = [];

    if (p.puedeAdminCoworking || p.puedeAdminCanchas || p.puedeAdminVehiculos) {
      nextSections.push({
        key: "admin",
        label: "Panel de control",
        items: [
          ...(p.puedeAdminCoworking
            ? [{ to: "/dashboard", label: "Administrar coworking" }]
            : []),
          ...(p.puedeAdminCanchas
            ? [{ to: "/dashboard-cancha", label: "Administrar canchas" }]
            : []),
          ...(p.puedeAdminVehiculos || p.puedeAdminCanchas
            ? [{ to: "/admin/vehiculos", label: "Administrar vehículos" }]
            : []),
        ],
      });
    }

    nextSections.push({
      key: "mis-reservas",
      label: "Mis reservas",
      items: [
        { to: "/mis-reservas", label: "Coworking" },
        { to: "/mis-reservas-cancha", label: "Cancha" },
        ...(p.puedeVerVehiculos && !esSoloChofer
          ? [{ to: "/vehiculos/mis", label: "Vehículos" }]
          : []),
      ],
    });

    nextSections.push({
      key: "reservar",
      label: "Reservar",
      items: [
        { to: "/reservar", label: "Coworking" },
        { to: "/cancha", label: "Cancha" },
        ...(p.puedeVerVehiculos && !esSoloChofer
          ? [{ to: "/vehiculos/reservar", label: "Vehículos" }]
          : []),
      ],
    });

    if (p.puedeAdminVehiculos) {
      nextSections.push({
        key: "vehiculos-admin",
        label: "Solicitudes",
        items: [
          { to: "/admin/vehiculos", label: "Solicitudes de vehículos" },
          { to: "/admin/vehiculos/aprobadas", label: "Reservas aprobadas" },
        ],
      });
    }

    if (p.puedeConducir) {
      nextSections.push({
        key: "chofer",
        label: "Chofer",
        items: [{ to: "/vehiculos/chofer", label: "Mis viajes" }],
      });
    }

    if (p.esTalentoHumano) {
      nextSections.push({
        key: "talento-humano",
        label: "Talento humano",
        items: [{ to: "/gestion-th", label: "Gestión TH" }],
      });
    }

    return nextSections;
  }, [
    esSoloChofer,
    p.esTalentoHumano,
    p.puedeAdminCanchas,
    p.puedeAdminCoworking,
    p.puedeAdminVehiculos,
    p.puedeVerVehiculos,
    p.puedeConducir,
  ]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenSection(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSection = (key: string) => {
    setOpenSection((current) => (current === key ? null : key));
  };

  const closeMenus = () => {
    setOpenSection(null);
    setMobileOpen(false);
  };

  return (
    <nav className="menu" ref={menuRef}>
      <div className="menu-brand">
        <img src={publicAssets.brandLogo} alt="Administración Zonal" />
        <div>
          <strong>Administración Zonal</strong>
          <span>Valle de los Chillos</span>
        </div>
      </div>

      <button
        type="button"
        className="menu-mobile-toggle"
        aria-expanded={mobileOpen}
        aria-label="Abrir menú"
        onClick={() => setMobileOpen((current) => !current)}
      >
        ☰
      </button>

      <div className={`menu-links ${mobileOpen ? "is-open" : ""}`}>
        <Link to="/perfil" className="menu-link" onClick={closeMenus}>
          Perfil
        </Link>

        {sections.map((section) => {
          const isOpen = openSection === section.key;

          return (
            <div
              key={section.key}
              className={`menu-item ${isOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="menu-trigger"
                aria-expanded={isOpen}
                onClick={() => toggleSection(section.key)}
              >
                {section.label}
                <span className="menu-caret">▾</span>
              </button>

              <div className="submenu">
                {section.items.map((item) => (
                  <Link key={item.to} to={item.to} onClick={closeMenus}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        <button type="button" className="menu-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
