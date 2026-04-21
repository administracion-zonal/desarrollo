import type { VehiculoReserva } from "../types/VehiculoReserva";

const API = `${import.meta.env.VITE_API_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error en la petición");
  }
  return res;
};

export const vehiculosService = {
  crear: async (data: VehiculoReserva) => {
    const res = await fetch(`${API}/vehiculos/reservar`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    await handleResponse(res);
    return res.json();
  },

  mis: async () => {
    const res = await fetch(`${API}/vehiculos/mis`, {
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },

  todas: async () => {
    const res = await fetch(`${API}/vehiculos/admin/todas`, {
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },

  aprobar: async (id: number) => {
    const res = await fetch(`${API}/vehiculos/admin/aprobar/${id}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },

  rechazar: async (id: number) => {
    const res = await fetch(`${API}/vehiculos/admin/rechazar/${id}`, {
      method: "PUT",
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },

  asignarChofer: async (data: { idReserva: number; idChofer: number }) => {
    const res = await fetch(`${API}/vehiculos/admin/asignar-chofer`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    await handleResponse(res);
    return res.json();
  },

  pdf: async (id: number) => {
    const res = await fetch(`${API}/vehiculos/admin/salvoconducto/${id}`, {
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.blob();
  },

  obtenerVehiculos: async () => {
    const res = await fetch(`${API}/vehiculos`, {
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },

  disponibilidad: async (idVehiculo: number, fecha: string) => {
    const params = new URLSearchParams({
      idVehiculo: String(idVehiculo),
      fecha,
    });

    const res = await fetch(`${API}/vehiculos/disponibilidad?${params}`, {
      headers: getHeaders(),
    });
    await handleResponse(res);
    return res.json();
  },
};
