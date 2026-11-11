import { apiFetch } from "../utils/api";

export type EstadoExpediente =
  | "BORRADOR"
  | "EN_REVISION"
  | "OBSERVADO"
  | "APROBADO"
  | "CERRADO"
  | "CANCELADO";

export type ExpedienteCompra = {
  id: number;
  titulo: string;
  objetoCompra: string;
  descripcion: string | null;
  referenciaOficial: string | null;
  estado: EstadoExpediente;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  createdBy: string;
  updatedBy: string;
};

export type DocumentoVersion = {
  id: number;
  categoria: string;
  version: number;
  nombreArchivo: string;
  tamanoBytes: number;
  subidoPor: string;
  subidoEn: string;
};

export type ExpedienteEvento = {
  estadoAnterior: string | null;
  estadoNuevo: string;
  observacion: string | null;
  actor: string;
  fecha: string;
};

const API = "/api/compras-publicas/expedientes";

async function jsonOrError<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export const comprasPublicasService = {
  asignarRol: async (cedula: string) =>
    jsonOrError<{ message: string }>(
      await apiFetch(`${API}/usuarios/${encodeURIComponent(cedula)}/rol`, {
        method: "POST",
      }),
    ),

  listar: async (): Promise<ExpedienteCompra[]> =>
    jsonOrError(await apiFetch(API)),

  crear: async (data: {
    titulo: string;
    objetoCompra: string;
    descripcion: string;
    referenciaOficial: string;
  }): Promise<ExpedienteCompra> =>
    jsonOrError(await apiFetch(API, {
      method: "POST",
      body: JSON.stringify(data),
    })),

  actualizar: async (
    id: number,
    data: {
      titulo: string;
      objetoCompra: string;
      descripcion: string;
      referenciaOficial: string;
    },
  ): Promise<ExpedienteCompra> =>
    jsonOrError(await apiFetch(`${API}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })),

  documentos: async (id: number): Promise<DocumentoVersion[]> =>
    jsonOrError(await apiFetch(`${API}/${id}/documentos`)),

  subirDocumento: async (id: number, categoria: string, archivo: File) => {
    const formData = new FormData();
    formData.append("categoria", categoria);
    formData.append("file", archivo);
    return jsonOrError<DocumentoVersion>(
      await apiFetch(`${API}/${id}/documentos`, {
        method: "POST",
        body: formData,
      }),
    );
  },

  cambiarEstado: async (id: number, estado: EstadoExpediente, observacion: string) =>
    jsonOrError<ExpedienteCompra>(
      await apiFetch(`${API}/${id}/estado`, {
        method: "PUT",
        body: JSON.stringify({ estado, observacion }),
      }),
    ),

  historial: async (id: number): Promise<ExpedienteEvento[]> =>
    jsonOrError(await apiFetch(`${API}/${id}/historial`)),

  descargar: async (id: number, idVersion: number) => {
    const response = await apiFetch(`${API}/${id}/documentos/${idVersion}/archivo`);
    if (!response.ok) throw new Error(await response.text());
    return response.blob();
  },
};
