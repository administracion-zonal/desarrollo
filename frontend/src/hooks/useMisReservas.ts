import { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import type { ReservaUsuario } from "../types/ReservaUsuario";

const API = `${import.meta.env.VITE_API_URL}/api/privado/mis-reservas`;

export function useMisReservas() {
  const [reservas, setReservas] = useState<ReservaUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Error al cargar reservas");
        }

        const data: ReservaUsuario[] = await res.json();
        setReservas(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error inesperado");
        }
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return { reservas, setReservas, loading, error };
}
