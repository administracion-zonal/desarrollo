import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import { permisos } from "../utils/permisos";

type MenuLinkItem = {
  label: string;
  to: string;
};

type MenuGroup = {
  id: string;
  label: string;
  links: MenuLinkItem[];
};

export default function Menu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const p = user ? permisos(user) : null;

  const roleLabel = useMemo(() => {
    if (!user) return "Usuario";
    if (user.roles.includes("ADMIN")) return "Administrador";
    if (user.roles.includes("ADMIN_COWORKING"))
      return "Administrador coworking";
    if (user.roles.includes("ADMIN_CANCHAS")) return "Administrador canchas";
    if (user.roles.includes("ADMIN_VEHICULOS"))
      return "Administrador vehiculos";
    if (user.roles.includes("TALENTO_HUMANO")) return "Talento humano";
    if (user.roles.includes("CHOFER")) return "Chofer";
    if (user.roles.includes("SERVIDOR_PUBLICO")) return "Servidor publico";
    if (user.roles.includes("SERVIDOR_AZVCH")) return "Servidor institucional";
    if (user.roles.includes("PRIVADO")) return "Privado";
    if (user.roles.includes("ESTUDIANTE")) return "Estudiante";
    return "Usuario";
  }, [user]);

  const groups = useMemo<MenuGroup[]>(() => {
    if (!p) return [];
    const items: MenuGroup[] = [];

    if (p.puedeAdminCoworking || p.puedeAdminCanchas) {
      items.push({
        id: "dashboard",
        label: "Dashboard",
        links: [
          ...(p.puedeAdminCoworking
            ? [{ label: "Admin coworking", to: "/dashboard" }]
            : []),
          ...(p.puedeAdminCanchas
            ? [{ label: "Admin cancha", to: "/dashboard-cancha" }]
            : []),
          ...(p.puedeAdminVehiculos
            ? [{ label: "Admin vehiculos", to: "/vehiculos/admin" }]
            : []),
        ],
      });
    }

    items.push({
      id: "mis-reservas",
      label: "Mis reservas",
      links: [
        { label: "Coworking", to: "/mis-reservas" },
        { label: "Cancha", to: "/mis-reservas-cancha" },
        ...(p.puedeVerVehiculos
          ? [{ label: "Vehiculos", to: "/vehiculos/mis" }]
          : []),
      ],
    });

    if (p.puedeVerReservasChofer) {
      items.push({
        id: "chofer",
        label: "Asignaciones",
        links: [{ label: "Viajes pendientes", to: "/vehiculos/chofer" }],
      });
    }

    items.push({
      id: "reservar",
      label: "Reservar",
      links: [
        { label: "Coworking", to: "/reservar" },
        { label: "Cancha", to: "/cancha" },
        ...(p.puedeReservarVehiculos
          ? [{ label: "Vehiculos", to: "/vehiculos/reservar" }]
          : []),
      ],
    });

    if (p.puedeAdminVehiculos) {
      items.push({
        id: "vehiculos-admin",
        label: "Vehiculos admin",
        links: [{ label: "Solicitudes", to: "/vehiculos/admin" }],
      });
    }

    if (p.esTalentoHumano) {
      items.push({
        id: "talento-humano",
        label: "Talento humano",
        links: [{ label: "Gestion de usuarios", to: "/gestion-th" }],
      });
    }

    return items;
  }, [p]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroup((current) => (current === groupId ? null : groupId));
  };

  const isGroupActive = (group: MenuGroup) =>
    group.links.some((item) => location.pathname.startsWith(item.to));

  const renderLink = (item: MenuLinkItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) => `menu-link${isActive ? " is-active" : ""}`}
    >
      {item.label}
    </NavLink>
  );

  return (
    <header className="menu-shell">
      <div className="menu-shell__inner">
        <div className="menu-topbar">
          <div className="menu-brand">
            <span className="menu-brand__title">
              Administracion Zonal Valle de Los Chillos
            </span>
          </div>

          <div className="menu-userbox">
            <strong className="menu-userbox__name">{user.nombres}</strong>
            <span className="menu-userbox__role">{roleLabel}</span>
          </div>
        </div>

        <div className="menu-bottombar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label="Mostrar navegacion"
          >
            Menu
          </button>

          <nav className={`menu${menuOpen ? " is-open" : ""}`}>
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                `menu-link${isActive ? " is-active" : ""}`
              }
            >
              Perfil
            </NavLink>

            {groups.map((group) => (
              <div
                key={group.id}
                className={`menu-group${openGroup === group.id ? " is-open" : ""}${
                  isGroupActive(group) ? " is-active" : ""
                }`}
                onMouseEnter={() => setOpenGroup(group.id)}
                onMouseLeave={() =>
                  setOpenGroup((current) =>
                    current === group.id ? null : current,
                  )
                }
              >
                <button
                  type="button"
                  className="menu-group__trigger"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={openGroup === group.id}
                >
                  {group.label}
                  <span className="menu-group__chevron">▾</span>
                </button>

                <div className="submenu">{group.links.map(renderLink)}</div>
              </div>
            ))}

            <button
              type="button"
              className="menu-logout"
              onClick={handleLogout}
            >
              Cerrar sesion
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
