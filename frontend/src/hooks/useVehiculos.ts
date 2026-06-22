import { useCallback, useState } from "react";
import { vehiculosService } from "../services/vehiculosService";
import type { VehiculoReserva } from "../types/VehiculoReserva";
import { apiFetch } from "../utils/api";
export const useVehiculos = () => {
  const [data, setData] = useState<VehiculoReserva[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarMis = useCallback(async () => {
    const res = await apiFetch("/vehiculos/mis");

    const text = await res.text();

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("No es JSON válido", e);
    }

    // 🔥 SOLUCIÓN
    if (Array.isArray(json)) {
      setData(json);
    } else if (Array.isArray(json.content)) {
      setData(json.content); // 🔥 spring pageable
    } else {
      setData([]); // fallback seguro
    }
  }, []);

  const cargarTodas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehiculosService.todas();

      if (Array.isArray(res)) {
        setData(res);
      } else if (res && Array.isArray((res as { data?: unknown }).data)) {
        setData((res as { data: VehiculoReserva[] }).data);
      } else {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    cargarMis,
    cargarTodas,
  };
};
