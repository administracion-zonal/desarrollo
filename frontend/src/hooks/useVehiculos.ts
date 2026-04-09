import { useState } from "react";
import { vehiculosService } from "../services/vehiculosService";
import type { VehiculoReserva } from "../types/VehiculoReserva";
import { apiFetch } from "../utils/api";
export const useVehiculos = () => {
  const [data, setData] = useState<VehiculoReserva[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarMis = async () => {
    const res = await apiFetch("/api/vehiculos/mis");

    console.log("STATUS 👉", res.status);

    const text = await res.text();
    console.log("RAW 👉", text);

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      console.error("No es JSON válido", e);
    }

    console.log("JSON 👉", json);

    // 🔥 SOLUCIÓN
    if (Array.isArray(json)) {
      setData(json);
    } else if (Array.isArray(json.content)) {
      setData(json.content); // 🔥 spring pageable
    } else {
      setData([]); // fallback seguro
    }
  };

  const cargarTodas = async () => {
    setLoading(true);
    const res = await vehiculosService.todas();
    setData(res.data);
    setLoading(false);
  };

  return {
    data,
    loading,
    cargarMis,
    cargarTodas,
  };
};
