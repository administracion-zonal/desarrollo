import type { RolUsuario } from "./User";

export interface AuthUser {
  idUsuario: number;
  cedula: string;
  nombres: string;
  correo: string;
  roles: RolUsuario[];
  fotoPerfil?: string;
  debeCambiarPassword: boolean;
  aceptaAcuerdo: boolean;
  institucion?: string;
  tipoUsuario?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => void;
  loading: boolean;
}
