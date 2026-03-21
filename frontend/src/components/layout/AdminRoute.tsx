import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import type { ReactNode } from "react";

type Props = Readonly<{
  children: ReactNode;
}>;

export default function AdminRoute({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "20px" }}>Verificando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.roles?.includes("ADMIN")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
