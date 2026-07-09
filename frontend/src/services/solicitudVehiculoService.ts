import { apiFetch } from "../utils/api";

/* ================= TYPES ================= */
export interface SolicitudVehiculoRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  destino: string;
  observaciones: string;
  origen: string;
  servidores: string;
}

export interface SolicitudVehiculo {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  destino: string;
  motivo: string;
  observaciones?: string;
  origen?: string;
  servidores?: string;
  observacionRechazo?: string;
  estado: string;

  nombres: string;
  cedula: string;
}

/* ================= SERVICE ================= */
export const solicitudVehiculoService = {
  crear: async (data: SolicitudVehiculoRequest) => {
    const res = await apiFetch("/api/vehiculos/solicitudes", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Error al enviar solicitud");
    }

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  },

  listarPendientes: async (): Promise<SolicitudVehiculo[]> => {
    const res = await apiFetch("/api/vehiculos/solicitudes/pendientes");

    if (!res.ok) throw new Error("Error al obtener solicitudes");
    return res.json();
  },

  aprobar: async (id: number, idChofer: number) => {
    const res = await apiFetch(`/api/vehiculos/solicitudes/${id}/aprobar`, {
      method: "POST",
      body: JSON.stringify({ idChofer }),
    });
    if (!res.ok) throw new Error(await res.text());
  },

  rechazar: async (id: number, observacionRechazo?: string) => {
    const res = await apiFetch(`/api/vehiculos/solicitudes/${id}/rechazar`, {
      method: "POST",
      body: JSON.stringify({ observacionRechazo }),
    });

    if (!res.ok) throw new Error(await res.text());
  },
};
