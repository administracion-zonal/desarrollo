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
  | "SERVIDOR"
  | "SERVIDOR_AZVCH"
  | "PRIVADO"
  | "ESTUDIANTE"
  | "CHOFER";
