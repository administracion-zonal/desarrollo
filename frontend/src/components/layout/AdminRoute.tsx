import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { permisos } from "../../utils/permisos";

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

  // 🔥 USAMOS TU SISTEMA CENTRALIZADO
  const p = permisos(user);

  // ✅ permisos válidos para dashboard
  if (
    !p.puedeAdminCoworking &&
    !p.puedeAdminCanchas &&
    !p.puedeAdminVehiculos
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
