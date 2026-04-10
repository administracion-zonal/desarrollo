import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import type { RolUsuario } from "../types/User";

type Props = {
  children: React.ReactNode;
  roles: RolUsuario[];
};

export default function RoleRoute({ children, roles }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = roles.some((r) => user.roles.includes(r));

  if (!hasAccess) return <Navigate to="/" replace />;

  return <>{children}</>;
}
