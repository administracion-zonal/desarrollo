import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../types/Auth";
import { AuthContext } from "./AuthContext";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export default function AuthProvider({ children }: Props) {
  const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  });

  const loading = false; // ya no necesitas loading dinámico
  const idleTimer = useRef<number | null>(null);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    if (!user) return;

    const resetIdleTimer = () => {
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }

      idleTimer.current = window.setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, IDLE_TIMEOUT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, resetIdleTimer, { passive: true }),
    );

    resetIdleTimer();

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, resetIdleTimer),
      );

      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, [user]);

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
