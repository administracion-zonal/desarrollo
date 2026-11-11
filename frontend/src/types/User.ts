export interface User {
  id: number;
  username: string;
  roles: RolUsuario[];
}

export type RolUsuario =
  | "ADMIN"
  | "ADMIN_COWORKING"
  | "ADMIN_VEHICULOS"
  | "ADMIN_CANCHAS"
  | "TALENTO_HUMANO"
  | "COMPRAS_PUBLICAS"
  | "SERVIDOR"
  | "SERVIDOR_AZVCH"
  | "SERVIDOR_PUBLICO"
  | "PRIVADO"
  | "ESTUDIANTE"
  | "CHOFER";
