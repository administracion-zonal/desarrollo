import { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthUser, RolUsuario } from "../types/Auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const id = localStorage.getItem("id");
    const rol = localStorage.getItem("rol");
    const nombres = localStorage.getItem("nombres");
    const fotoPerfil = localStorage.getItem("fotoPerfil");

    if (rol && nombres && id) {
      return {
        id: Number(id),
        nombres,
        rol: rol as RolUsuario,
        fotoPerfil: fotoPerfil || undefined,
      };
    }

    return null;
  });

  const loading = false; // ya no necesitas loading dinámico

  const logout = () => {
    localStorage.removeItem("id");
    localStorage.removeItem("token");
    localStorage.removeItem("nombres");
    localStorage.removeItem("rol");
    localStorage.removeItem("fotoPerfil");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
