import type { User } from "../types/User";

export const hasRole = (user: User | null, roles: string[]): boolean =>
  !!user && roles.some((r) => user.roles.includes(r));

export const hasAnyRole = (user: User | null, roles: string[]) =>
  roles.some((r) => user?.roles?.includes(r));
