import { useCallback, useEffect, useMemo, useState } from "react";
import {
  comprasPublicasService,
  type DocumentoVersion,
  type EstadoExpediente,
  type ExpedienteCompra,
  type ExpedienteEvento,
} from "../services/comprasPublicasService";

const formularioVacio = {
  titulo: "",
  objetoCompra: "",
  descripcion: "",
  referenciaOficial: "",
};

function estadosSiguientes(
  estado: EstadoExpediente,
  esAdmin: boolean,
): EstadoExpediente[] {
  switch (estado) {
    case "BORRADOR":
      return ["EN_REVISION", "CANCELADO"];
    case "EN_REVISION":
      return ["OBSERVADO", "APROBADO", "CANCELADO"];
    case "OBSERVADO":
      return ["EN_REVISION", "CANCELADO"];
    case "APROBADO":
      return esAdmin ? ["CERRADO", "CANCELADO"] : ["CANCELADO"];
    case "CERRADO":
    case "CANCELADO":
      return [];
  }
}

export default function AdminComprasPublicas() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const esAdmin = user?.roles?.includes("ADMIN") ?? false;

  const [expedientes, setExpedientes] = useState<ExpedienteCompra[]>([]);
  const [seleccionado, setSeleccionado] = useState<ExpedienteCompra | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoVersion[]>([]);
  const [historial, setHistorial] = useState<ExpedienteEvento[]>([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [editando, setEditando] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoExpediente | "">("");
  const [observacion, setObservacion] = useState("");
  const [cedulaResponsable, setCedulaResponsable] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const opcionesEstado = useMemo(
    () => seleccionado ? estadosSiguientes(seleccionado.estado, esAdmin) : [],
    [seleccionado, esAdmin],
  );

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setExpedientes(await comprasPublicasService.listar());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar expedientes");
    }
  }, []);

  const cargarDetalle = useCallback(async (id: number) => {
    try {
      const [docs, eventos] = await Promise.all([
        comprasPublicasService.documentos(id),
        comprasPublicasService.historial(id),
      ]);
      setDocumentos(docs);
      setHistorial(eventos);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el detalle");
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const seleccionar = async (expediente: ExpedienteCompra) => {
    setSeleccionado(expediente);
    setEstadoNuevo("");
    setObservacion("");
    await cargarDetalle(expediente.id);
  };

  const guardarExpediente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);
    try {
      const expediente = editando && seleccionado
        ? await comprasPublicasService.actualizar(seleccionado.id, formulario)
        : await comprasPublicasService.crear(formulario);
      setSeleccionado(expediente);
      setEditando(false);
      setFormulario(formularioVacio);
      setMensaje(editando ? "Expediente actualizado." : "Expediente creado en borrador.");
      await cargar();
      await cargarDetalle(expediente.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el expediente");
    } finally {
      setLoading(false);
    }
  };

  const editarExpediente = () => {
    if (!seleccionado) return;
    setFormulario({
      titulo: seleccionado.titulo,
      objetoCompra: seleccionado.objetoCompra,
      descripcion: seleccionado.descripcion ?? "",
      referenciaOficial: seleccionado.referenciaOficial ?? "",
    });
    setEditando(true);
    setMensaje(null);
  };

  const subirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionado || !archivo || !categoria.trim()) return;
    if (archivo.size > 20 * 1024 * 1024) {
      setError("El archivo supera el límite de 20 MB.");
      return;
    }
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      await comprasPublicasService.subirDocumento(seleccionado.id, categoria, archivo);
      setArchivo(null);
      setCategoria("");
      setMensaje("Nueva versión documental cargada.");
      await cargarDetalle(seleccionado.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionado || !estadoNuevo) return;
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const expediente = await comprasPublicasService.cambiarEstado(
        seleccionado.id,
        estadoNuevo,
        observacion,
      );
      setSeleccionado(expediente);
      setEstadoNuevo("");
      setObservacion("");
      setMensaje(`Estado actualizado a ${expediente.estado}.`);
      await cargar();
      await cargarDetalle(expediente.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const descargarDocumento = async (documento: DocumentoVersion) => {
    if (!seleccionado) return;
    try {
      const blob = await comprasPublicasService.descargar(seleccionado.id, documento.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documento.nombreArchivo;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el documento");
    }
  };

  const asignarRol = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await comprasPublicasService.asignarRol(cedulaResponsable.trim());
      setMensaje(resultado.message);
      setCedulaResponsable("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo asignar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flow-stack">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Gestión interna</span>
        <h2>Expedientes de Compras Públicas</h2>
        <p>
          Registro, revisión y trazabilidad documental interna. Este módulo no
          reemplaza la plataforma oficial de contratación.
        </p>
      </div>

      {error && <p className="error">{error}</p>}
      {mensaje && <p className="success-message">{mensaje}</p>}

      {esAdmin && (
        <section className="form-panel flow-stack">
          <h3>Habilitar responsable de Compras Públicas</h3>
          <form onSubmit={asignarRol} className="form-grid-2">
            <div className="field">
              <label htmlFor="compras-cedula">Cédula del usuario</label>
              <input
                id="compras-cedula"
                required
                value={cedulaResponsable}
                onChange={(e) => setCedulaResponsable(e.target.value)}
              />
            </div>
            <button type="submit" className="actions" disabled={loading}>
              Asignar perfil
            </button>
          </form>
        </section>
      )}

      <section className="form-panel flow-stack">
        <h3>{editando ? "Editar expediente" : "Crear expediente"}</h3>
        <form onSubmit={guardarExpediente} className="form-grid-2">
          <div className="field span-2">
            <label htmlFor="expediente-titulo">Título</label>
            <input
              id="expediente-titulo"
              maxLength={200}
              required
              value={formulario.titulo}
              onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="expediente-objeto">Objeto de contratación</label>
            <textarea
              id="expediente-objeto"
              required
              value={formulario.objetoCompra}
              onChange={(e) => setFormulario({ ...formulario, objetoCompra: e.target.value })}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="expediente-descripcion">Descripción / observaciones</label>
            <textarea
              id="expediente-descripcion"
              value={formulario.descripcion}
              onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
            />
          </div>
          <div className="field span-2">
            <label htmlFor="expediente-referencia">Referencia en plataforma oficial (opcional)</label>
            <input
              id="expediente-referencia"
              maxLength={200}
              value={formulario.referenciaOficial}
              onChange={(e) => setFormulario({ ...formulario, referenciaOficial: e.target.value })}
            />
          </div>
          <div className="table-actions span-2">
            <button type="submit" className="actions" disabled={loading}>
              {loading ? "Guardando..." : editando ? "Guardar cambios" : "Crear borrador"}
            </button>
            {editando && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setEditando(false);
                  setFormulario(formularioVacio);
                }}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="flow-stack">
        <h3>Expedientes registrados</h3>
        {expedientes.length === 0 ? (
          <p>No hay expedientes registrados.</p>
        ) : (
          <table className="reservas-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Referencia oficial</th>
                <th>Estado</th>
                <th>Actualizado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((expediente) => (
                <tr key={expediente.id}>
                  <td>{expediente.titulo}</td>
                  <td>{expediente.referenciaOficial || "—"}</td>
                  <td>{expediente.estado}</td>
                  <td>{new Date(expediente.updatedAt).toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={() => void seleccionar(expediente)}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {seleccionado && (
        <section className="form-panel flow-stack">
          <div className="section-heading">
            <h3>{seleccionado.titulo}</h3>
            <span className="status-pill status-pill--info">{seleccionado.estado}</span>
          </div>
          <p>{seleccionado.objetoCompra}</p>
          {seleccionado.descripcion && <p>{seleccionado.descripcion}</p>}
          <p>
            Responsable: {seleccionado.createdBy} · Última actualización: {seleccionado.updatedBy}
          </p>

          {(seleccionado.estado === "BORRADOR" || seleccionado.estado === "OBSERVADO") && (
            <button type="button" className="btn" onClick={editarExpediente}>
              Editar datos
            </button>
          )}

          {(seleccionado.estado === "BORRADOR" || seleccionado.estado === "OBSERVADO") && (
            <form onSubmit={subirDocumento} className="form-grid-2">
              <div className="field">
                <label htmlFor="documento-categoria">Categoría del documento</label>
                <input
                  id="documento-categoria"
                  maxLength={120}
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="documento-archivo">Archivo (máximo 20 MB)</label>
                <input
                  id="documento-archivo"
                  type="file"
                  required
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
              </div>
              <button type="submit" className="actions span-2" disabled={loading || !archivo}>
                Cargar nueva versión
              </button>
            </form>
          )}

          <div>
            <h4>Documentos y versiones</h4>
            {documentos.length === 0 ? (
              <p>No hay archivos cargados.</p>
            ) : (
              <table className="reservas-table">
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Versión</th>
                    <th>Archivo</th>
                    <th>Subido por / fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((documento) => (
                    <tr key={documento.id}>
                      <td>{documento.categoria}</td>
                      <td>v{documento.version}</td>
                      <td>{documento.nombreArchivo}</td>
                      <td>{documento.subidoPor} · {new Date(documento.subidoEn).toLocaleString()}</td>
                      <td>
                        <button type="button" onClick={() => void descargarDocumento(documento)}>
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {opcionesEstado.length > 0 && (
            <form onSubmit={cambiarEstado} className="form-grid-2">
              <div className="field">
                <label htmlFor="nuevo-estado">Siguiente estado</label>
                <select
                  id="nuevo-estado"
                  required
                  value={estadoNuevo}
                  onChange={(e) => setEstadoNuevo(e.target.value as EstadoExpediente)}
                >
                  <option value="">Seleccione</option>
                  {opcionesEstado.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="observacion-estado">Observación (requerida al observar o cancelar)</label>
                <textarea
                  id="observacion-estado"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
              <button type="submit" className="actions span-2" disabled={loading || !estadoNuevo}>
                Registrar cambio de estado
              </button>
            </form>
          )}

          <div>
            <h4>Historial de auditoría</h4>
            {historial.length === 0 ? (
              <p>Sin eventos registrados.</p>
            ) : (
              <ul>
                {historial.map((evento, index) => (
                  <li key={`${evento.fecha}-${index}`}>
                    {new Date(evento.fecha).toLocaleString()} · {evento.actor} ·{" "}
                    {evento.estadoAnterior || "—"} → {evento.estadoNuevo}
                    {evento.observacion ? ` · ${evento.observacion}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
