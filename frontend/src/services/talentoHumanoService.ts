import { apiFetch } from "../utils/api";

const API = `/talento-humano`;

export const getDocumentos = async (idUsuario: number) => {
  const res = await apiFetch(`${API}/documentos/${idUsuario}`);
  if (!res.ok) throw new Error("Error " + res.status);
  return res.json();
};

export const uploadDocumento = async (formData: FormData) => {
  return await apiFetch(`${API}/documento/upload`, {
    method: "POST",
    body: formData,
  });
};

export const finalizarProceso = async (data: {
  idUsuario: number;
  idChecklist: number;
  tipo: string;
}) => {
  const params = new URLSearchParams({
    idUsuario: String(data.idUsuario),
    idChecklist: String(data.idChecklist),
    tipo: data.tipo,
  });

  return await apiFetch(`${API}/proceso/finalizar?${params}`, {
    method: "POST",
  });
};
