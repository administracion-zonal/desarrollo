import { apiFetch } from "../utils/api";

const API = `/talento-humano`;

export type DocumentoTH = {
  id: number;
  idDocumentoTipo: number;
  nombre: string;
  estado: string;
  tipo: string;
  archivoDisponible: boolean;
  observacionRevision?: string | null;
  obligatorio: boolean;
  incluidoEnChecklist: boolean;
  archivoExtension: string;
  plantillaDisponible: boolean;
  plantillaNombre?: string | null;
};

export type ProcesoUsuario = {
  id: number;
  tipo: string;
  estado: string;
  idChecklist: number | null;
  nombreChecklist: string;
};

export type ChecklistConfiguracion = {
  idChecklist: number;
  tipo: string;
  nombre: string;
  cantidadDocumentos: number;
};

export type DocumentoTipoTH = {
  idDocumentoTipo: number;
  nombre: string;
  tipoProceso: string;
  plantillaDisponible: boolean;
  plantillaNombre?: string | null;
};

export type EstadoLaboralTH = {
  cedula: string;
  nombres: string;
  activo: boolean;
};

export type AltaUsuario = {
  idUsuario: number;
  creado: boolean;
  claveTemporal: string | null;
  idProceso: number;
};

export type ConsultaUsuarioTH = {
  existe: boolean;
  nombres: string | null;
};

export const getDocumentos = async (idUsuario: number): Promise<DocumentoTH[]> => {
  const res = await apiFetch(`${API}/documentos/${idUsuario}`);
  if (!res.ok) throw new Error("Error " + res.status);
  return res.json();
};

export const getDocumentosParaRevision = async (cedula: string): Promise<DocumentoTH[]> => {
  const res = await apiFetch(
    `${API}/usuarios/${encodeURIComponent(cedula)}/documentos`,
  );
  if (!res.ok) throw new Error("No se pudieron cargar los documentos");
  return res.json();
};

export const consultarUsuarioTH = async (cedula: string): Promise<ConsultaUsuarioTH> => {
  const res = await apiFetch(
    `${API}/usuarios/${encodeURIComponent(cedula)}/consulta`,
  );
  if (!res.ok) throw new Error("No se pudo verificar la cédula");
  return res.json();
};

export const getProcesoActual = async (): Promise<ProcesoUsuario | null> => {
  const res = await apiFetch(`${API}/proceso/actual`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("No hay un proceso activo");
  return res.json();
};

export const getIngresoAprobado = async (): Promise<boolean> => {
  const proceso = await getProcesoActual();
  return proceso === null || proceso.tipo !== "INGRESO";
};

export const getChecklists = async (tipo: string): Promise<ChecklistConfiguracion[]> => {
  const params = new URLSearchParams({ tipo });
  const res = await apiFetch(`${API}/checklists?${params}`);
  if (!res.ok) throw new Error("No se pudieron cargar los checklists");
  return res.json();
};

export const getTiposDocumento = async (tipo: string): Promise<DocumentoTipoTH[]> => {
  const params = new URLSearchParams({ tipo });
  const res = await apiFetch(`${API}/documentos-tipo?${params}`);
  if (!res.ok) throw new Error("No se pudieron cargar los tipos de documento");
  return res.json();
};

export const uploadDocumento = async (formData: FormData) => {
  return await apiFetch(`${API}/documento/upload`, {
    method: "POST",
    body: formData,
  });
};

export const uploadPlantilla = async (idDocumentoTipo: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch(`${API}/plantilla/${idDocumentoTipo}/upload`, {
    method: "POST",
    body: formData,
  });
};

export const descargarPlantilla = async (idDocumentoTipo: number) => {
  const res = await apiFetch(`${API}/plantilla/${idDocumentoTipo}/archivo`);
  if (!res.ok) throw new Error("No se pudo descargar el formato");
  return res.blob();
};

export const actualizarEstadoDocumento = async (
  id: number,
  estado: "APROBADA" | "RECHAZADO",
  observacion?: string,
) => {
  const params = new URLSearchParams({ estado });
  if (observacion) params.set("observacion", observacion);
  return apiFetch(`${API}/documento/${id}/estado?${params}`, {
    method: "PUT",
  });
};

export const iniciarProceso = async (
  cedula: string,
  tipo: string,
  motivo?: string,
) => {
  const params = new URLSearchParams({ tipo });
  if (motivo) params.set("motivo", motivo);
  const res = await apiFetch(
    `${API}/usuarios/${encodeURIComponent(cedula)}/procesos?${params}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error("No se pudo iniciar el proceso");
  return res.json();
};

export const descargarDocumento = async (id: number) => {
  const res = await apiFetch(`${API}/documento/${id}/archivo`);
  if (!res.ok) throw new Error("No se pudo abrir el documento");
  return res.blob();
};

export const getEstadoLaboral = async (cedula: string): Promise<EstadoLaboralTH> => {
  const res = await apiFetch(`${API}/usuarios/${encodeURIComponent(cedula)}/estado-laboral`);
  if (!res.ok) throw new Error("No se encontró el usuario");
  return res.json();
};

export const actualizarEstadoLaboral = async (cedula: string, activo: boolean) => {
  const params = new URLSearchParams({ activo: String(activo) });
  const res = await apiFetch(
    `${API}/usuarios/${encodeURIComponent(cedula)}/estado-laboral?${params}`,
    { method: "PUT" },
  );
  if (!res.ok) throw new Error("No se pudo actualizar el estado laboral");
  return res.json() as Promise<EstadoLaboralTH>;
};

export const finalizarProceso = async (data: {
  idUsuario: number;
  idChecklist: number;
  tipo: string;
}): Promise<ProcesoUsuario | null> => {
  const params = new URLSearchParams({
    idUsuario: String(data.idUsuario),
    idChecklist: String(data.idChecklist),
    tipo: data.tipo,
  });

  const res = await apiFetch(`${API}/proceso/finalizar?${params}`, {
    method: "POST",
  });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("No se pudo finalizar el proceso");
  return res.json();
};
