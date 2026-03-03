export type RolUsuario =
  | "ADMIN"
  | "SERVIDOR"
  | "SERVIDOR_AZVCH"
  | "PRIVADO"
  | "ESTUDIANTE";

export interface AuthUser {
  id: number;
  cedula: string;
  nombres: string;
  correo: string;
  roles: RolUsuario[];
  fotoPerfil?: string;
  debeCambiarPassword: boolean;
  aceptaAcuerdo: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => void;
  loading: boolean;
}
