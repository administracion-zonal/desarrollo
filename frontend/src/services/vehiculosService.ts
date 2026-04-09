import axios from "axios";
import type { VehiculoReserva } from "../types/VehiculoReserva";

const API = `/api`;

const getHeaders = () => {
  const token = localStorage.getItem("token");

  console.log("TOKEN 👉", token); // 👈 AGREGA ESTO

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const vehiculosService = {
  crear: (data: VehiculoReserva) =>
    axios.post<VehiculoReserva>(`${API}/vehiculos/reservar`, data, {
      headers: getHeaders(),
    }),

  mis: () =>
    axios.get<VehiculoReserva[]>(`${API}/vehiculos/mis`, {
      headers: getHeaders(),
    }),

  todas: () =>
    axios.get<VehiculoReserva[]>(`${API}/vehiculos/admin/todas`, {
      headers: getHeaders(),
    }),

  aprobar: (id: number) =>
    axios.put(
      `${API}/vehiculos/admin/aprobar/${id}`,
      {},
      {
        headers: getHeaders(),
      },
    ),

  rechazar: (id: number) =>
    axios.put(
      `${API}/vehiculos/admin/rechazar/${id}`,
      {},
      {
        headers: getHeaders(),
      },
    ),

  asignarChofer: (data: { idReserva: number; idChofer: number }) =>
    axios.put(`${API}/vehiculos/admin/asignar-chofer`, data, {
      headers: getHeaders(),
    }),

  pdf: (id: number) =>
    axios.get<Blob>(`${API}/vehiculos/admin/salvoconducto/${id}`, {
      headers: getHeaders(),
      responseType: "blob",
    }),

  obtenerVehiculos: () =>
    axios.get(`${API}/vehiculos`, {
      headers: getHeaders(),
    }),
  disponibilidad: (idVehiculo: number, fecha: string) =>
    axios.get(`${API}/vehiculos/disponibilidad`, {
      params: { idVehiculo, fecha },
      headers: getHeaders(),
    }),
};
