import type React from "react";

export type RolUsuario =
  | "EXTERNO"
  | "SERVIDOR"
  | "ADMIN"
  | "PRIVADO"
  | "ESTUDIANTE";

export interface AuthUser {
  id: number;
  cedula: string;
  nombres: string;
  rol: RolUsuario;
  correo: string;
  fotoPerfil?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => void;
  loading: boolean;
}
