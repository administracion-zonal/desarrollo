import { apiFetch } from "../utils/api";

/* ================= TYPES ================= */
export interface SolicitudVehiculoRequest {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

export interface SolicitudVehiculo {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  usuario: {
    nombres: string;
    cedula: string;
  };
}

/* ================= SERVICE ================= */
export const solicitudVehiculoService = {
  crear: async (data: SolicitudVehiculoRequest) => {
    const res = await apiFetch("/vehiculos/solicitudes", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Error al enviar solicitud");
    }

    return res.json();
  },

  listarPendientes: async (): Promise<SolicitudVehiculo[]> => {
    const res = await apiFetch("/vehiculos/solicitudes/pendientes");

    if (!res.ok) throw new Error("Error al obtener solicitudes");
    return res.json();
  },

  aprobar: async (id: number) => {
    const res = await apiFetch(`/vehiculos/solicitudes/${id}/aprobar`, {
      method: "POST",
    });

    if (!res.ok) throw new Error(await res.text());
  },

  rechazar: async (id: number) => {
    const res = await apiFetch(`/vehiculos/solicitudes/${id}/rechazar`, {
      method: "POST",
    });

    if (!res.ok) throw new Error(await res.text());
  },
};
