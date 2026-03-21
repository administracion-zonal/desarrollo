import { useState } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthUser } from "../types/Auth";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  });

  const loading = false; // ya no necesitas loading dinámico

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
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
