import type { RolUsuario, User } from "../types/User";

export const hasRole = (user: User | null, roles: RolUsuario[]): boolean =>
  !!user && roles.some((r) => user.roles.includes(r));

export const hasAnyRole = (user: User | null, roles: RolUsuario[]) =>
  roles.some((r) => user?.roles?.includes(r));
