import type { AuthUser } from "../types/Auth";

export const permisos = (user: AuthUser) => {
  const roles = new Set(user.roles);
  const has = (role: string) => roles.has(role as never);
  const esSuperAdmin = has("ADMIN");

  return {
    esSuperAdmin,
    puedeAdminCoworking: esSuperAdmin || has("ADMIN_COWORKING"),
    puedeAdminCanchas: esSuperAdmin || has("ADMIN_CANCHAS"),
    puedeAdminVehiculos: esSuperAdmin || has("ADMIN_VEHICULOS"),
    puedeVerVehiculos:
      esSuperAdmin ||
      has("SERVIDOR_AZVCH") ||
      has("SERVIDOR_PUBLICO") ||
      has("TALENTO_HUMANO") ||
      has("CHOFER"),
    esTalentoHumano: esSuperAdmin || has("TALENTO_HUMANO"),
    puedeConducir: esSuperAdmin || has("CHOFER"),
  };
};
