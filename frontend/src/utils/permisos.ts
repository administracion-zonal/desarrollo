import type { AuthUser } from "../types/Auth";

export const permisos = (user: AuthUser) => {
  const roles = user.roles;
  const esChofer = roles.includes("CHOFER");
  const esAdminSistema = roles.includes("ADMIN");

  return {
    esChofer,

    puedeAdminCoworking: roles.includes("ADMIN_COWORKING") || esAdminSistema,

    puedeAdminCanchas: roles.includes("ADMIN_CANCHAS") || esAdminSistema,
    puedeAdminVehiculos: roles.includes("ADMIN_VEHICULOS") || esAdminSistema,

    // Si el usuario también es chofer, no debe ver los menús de reservas/solicitudes de vehículos de funcionario.
    puedeVerVehiculos:
      !esChofer &&
      (roles.includes("SERVIDOR_AZVCH") ||
        roles.includes("TALENTO_HUMANO") ||
        esAdminSistema),

    puedeReservarVehiculos:
      !esChofer && (roles.includes("SERVIDOR_AZVCH") || esAdminSistema),

    puedeVerReservasChofer: esChofer,

    esTalentoHumano: roles.includes("TALENTO_HUMANO"), // luego cambias a TALENTO_HUMANO
  };
};
