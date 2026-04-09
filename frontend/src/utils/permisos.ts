import type { AuthUser } from "../types/Auth";

export const permisos = (user: AuthUser) => {
  const roles = user.roles;

  return {
    puedeAdminCoworking:
      roles.includes("ADMIN_COWORKING") || roles.includes("ADMIN"),

    puedeAdminCanchas: roles.includes("ADMIN"),
    puedeAdminVehiculos: roles.includes("ADMIN_VEHICULOS"), // luego separas por rol real

    puedeVerVehiculos:
      roles.includes("SERVIDOR_AZVCH") || roles.includes("TALENTO_HUMANO"),

    esTalentoHumano: roles.includes("TALENTO_HUMANO"), // luego cambias a TALENTO_HUMANO
  };
};
