import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "../utils/api";
import {
  actualizarEstadoLaboral,
  actualizarEstadoDocumento,
  consultarUsuarioTH,
  descargarDocumento,
  getEstadoLaboral,
  getChecklists,
  getDocumentosParaRevision,
  getTiposDocumento,
  iniciarProceso,
  uploadPlantilla,
} from "../services/talentoHumanoService";
import type {
  ChecklistConfiguracion,
  DocumentoTipoTH,
  DocumentoTH,
  EstadoLaboralTH,
} from "../services/talentoHumanoService";
import { validarCedula } from "../utils/validaciones";

const API = `/talento-humano`;

export default function GestionTH() {
  const [tab, setTab] = useState<
    "ingreso" | "documentos" | "formatos" | "salida" | "capacitacion" | "usuarios"
  >("ingreso");
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [checklistsIngreso, setChecklistsIngreso] = useState<ChecklistConfiguracion[]>([]);
  const [cedulaVerificada, setCedulaVerificada] = useState("");
  const [usuarioExiste, setUsuarioExiste] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cedulaRevision, setCedulaRevision] = useState("");
  const [documentosRevision, setDocumentosRevision] = useState<DocumentoTH[]>([]);
  const [cedulaConsultada, setCedulaConsultada] = useState("");
  const [observacionesRevision, setObservacionesRevision] = useState<Record<number, string>>({});
  const [motivoDesvinculacion, setMotivoDesvinculacion] = useState("");
  const [tiposDocumento, setTiposDocumento] = useState<DocumentoTipoTH[]>([]);
  const [plantillaGuardando, setPlantillaGuardando] = useState<number | null>(null);
  const [mensajeProceso, setMensajeProceso] = useState<string | null>(null);
  const [errorProceso, setErrorProceso] = useState<string | null>(null);
  const [cedulaProceso, setCedulaProceso] = useState("");
  const [cedulaCapacitacion, setCedulaCapacitacion] = useState("");
  const [cedulaEstado, setCedulaEstado] = useState("");
  const [estadoLaboral, setEstadoLaboral] = useState<EstadoLaboralTH | null>(null);
  const [errorEstado, setErrorEstado] = useState<string | null>(null);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState(false);

  useEffect(() => {
    getChecklists("INGRESO")
      .then(setChecklistsIngreso)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar checklists"),
      );
  }, []);

  useEffect(() => {
    getTiposDocumento("INGRESO")
      .then(setTiposDocumento)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudieron cargar formatos"),
      );
  }, []);

  const verificarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!validarCedula(cedula)) {
      setError("Ingrese una cédula ecuatoriana válida.");
      return;
    }
    try {
      setLoading(true);
      const resultado = await consultarUsuarioTH(cedula);
      setCedulaVerificada(cedula);
      setUsuarioExiste(resultado.existe);
      setNombres(resultado.nombres || "");
      setOk(resultado.existe
        ? `Cédula verificada. Usuario encontrado: ${resultado.nombres}.`
        : "Cédula válida, pero no existe en la base. Ingrese los nombres para crearlo.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo verificar la cédula");
    } finally {
      setLoading(false);
    }
  };

  const crearUsuario = async () => {
    setError(null);
    setOk(null);
    if (cedulaVerificada !== cedula || usuarioExiste === null) {
      setError("Verifique la cédula antes de iniciar el proceso.");
      return;
    }
    if (!usuarioExiste && !nombres.trim()) {
      setError("Ingrese los nombres completos del nuevo servidor.");
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/crear-o-activar`, {
        method: "POST",
        body: JSON.stringify({
          cedula,
          nombres,
        }),
      });
      if (!res.ok) {
        const detalle = await res.text();
        throw new Error(detalle || "No se pudo iniciar el ingreso");
      }
      const resultado: {
        creado: boolean;
        claveTemporal: string | null;
      } = await res.json();
      setOk(
        resultado.creado
          ? `Usuario creado. Clave temporal de entrega segura: ${resultado.claveTemporal}`
          : "Proceso de ingreso iniciado para el usuario existente.",
      );
      setCedulaProceso(cedula);
      setCedulaRevision(cedula);
      setCedula("");
      setNombres("");
      setCedulaVerificada("");
      setUsuarioExiste(null);
    } catch (e) {
      const errorServidor = e instanceof Error ? e.message : "";
      try {
        const detalle = JSON.parse(errorServidor) as {
          detail?: string;
          message?: string;
          error?: string;
          status?: number;
          path?: string;
        };
        setError(
          detalle.detail
            || detalle.message
            || (detalle.status && detalle.error
              ? `Error ${detalle.status}: ${detalle.error}${detalle.path ? ` en ${detalle.path}` : ""}. Revise los logs del backend para conocer la causa.`
              : null)
            || detalle.error
            || "No se pudo crear el servidor. Revise la configuración del backend.",
        );
      } catch {
        setError(errorServidor || "Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarDocumentosRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validarCedula(cedulaRevision)) {
      setError("Ingrese una cédula ecuatoriana válida.");
      return;
    }
    try {
      setDocumentosRevision([]);
      setCedulaConsultada("");
      const documentos = await getDocumentosParaRevision(cedulaRevision);
      setDocumentosRevision(documentos);
      setCedulaConsultada(cedulaRevision);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar documentos");
    }
  };

  const revisarDocumento = async (id: number, estado: "APROBADA" | "RECHAZADO") => {
    const observacion = observacionesRevision[id]?.trim();
    if (estado === "RECHAZADO" && !observacion) {
      setError("Indique una observación antes de rechazar el documento.");
      return;
    }
    try {
      setError(null);
      const notaRevision = estado === "RECHAZADO" ? observacion : undefined;
      await actualizarEstadoDocumento(
        id,
        estado,
        notaRevision,
      );
      setDocumentosRevision((actuales) =>
        actuales.map((doc) => (doc.id === id
          ? { ...doc, estado, observacionRevision: notaRevision ?? null }
          : doc)),
      );
      setObservacionesRevision((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[id];
        return siguientes;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el documento");
    }
  };

  const verDocumento = async (id: number) => {
    const ventana = window.open("about:blank", "_blank");
    if (!ventana) {
      setError("Permita ventanas emergentes para visualizar el documento.");
      return;
    }
    try {
      const blob = await descargarDocumento(id);
      const url = URL.createObjectURL(blob);
      ventana.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      ventana.close();
      setError(e instanceof Error ? e.message : "No se pudo visualizar el documento");
    }
  };

  const descargarArchivo = async (id: number, extension: string) => {
    try {
      const blob = await descargarDocumento(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `documento-${id}.${extension || "pdf"}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el documento");
    }
  };

  const iniciarProcesoUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProceso(null);
    setMensajeProceso(null);
    if (!validarCedula(cedulaProceso)) {
      setErrorProceso("Ingrese una cédula ecuatoriana válida.");
      return;
    }
    try {
      const motivo = motivoDesvinculacion.trim();
      if (!motivo) {
        setErrorProceso("Ingrese el motivo de la desvinculación.");
        return;
      }
      await iniciarProceso(cedulaProceso, "SALIDA", motivo);
      setMensajeProceso(
        `Desvinculación iniciada para ${cedulaProceso}. Motivo: ${motivo}`,
      );
    } catch (e: unknown) {
      setErrorProceso(e instanceof Error ? e.message : "No se pudo iniciar el proceso");
    }
  };

  const iniciarCapacitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProceso(null);
    setMensajeProceso(null);
    if (!validarCedula(cedulaCapacitacion)) {
      setErrorProceso("Ingrese una cédula ecuatoriana válida.");
      return;
    }
    try {
      await iniciarProceso(cedulaCapacitacion, "PERMANENCIA");
      setMensajeProceso(`Carga de certificados habilitada para ${cedulaCapacitacion}.`);
    } catch (e: unknown) {
      setErrorProceso(e instanceof Error ? e.message : "No se pudo habilitar la carga");
    }
  };

  const cargarEstadoLaboral = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorEstado(null);
    setMensajeEstado(null);
    if (!validarCedula(cedulaEstado)) {
      setErrorEstado("Ingrese una cédula ecuatoriana válida.");
      return;
    }

    try {
      setCargandoEstado(true);
      setEstadoLaboral(await getEstadoLaboral(cedulaEstado));
    } catch (e) {
      setErrorEstado(e instanceof Error ? e.message : "No se pudo consultar el usuario");
    } finally {
      setCargandoEstado(false);
    }
  };

  const cambiarEstadoLaboral = async (activo: boolean) => {
    if (!estadoLaboral) return;
    setErrorEstado(null);
    setMensajeEstado(null);
    try {
      setCargandoEstado(true);
      setEstadoLaboral(await actualizarEstadoLaboral(estadoLaboral.cedula, activo));
      setMensajeEstado(activo
        ? "Usuario reactivado. Puede volver a ingresar al sistema."
        : "Usuario bloqueado y marcado como inactivo.");
    } catch (e) {
      setErrorEstado(e instanceof Error ? e.message : "No se pudo actualizar el estado");
    } finally {
      setCargandoEstado(false);
    }
  };

  const guardarPlantilla = async (
    idDocumentoTipo: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const documento = tiposDocumento.find(
      (tipo) => tipo.idDocumentoTipo === idDocumentoTipo,
    );
    const extensionEsperada = documento?.nombre.includes("Formulario 107")
      ? "xlsx"
      : "docx";
    if (!archivo.name.toLowerCase().endsWith(`.${extensionEsperada}`)) {
      setError(`Este formato debe cargarse como archivo .${extensionEsperada}.`);
      e.target.value = "";
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setError("El formato supera el límite de 10 MB.");
      e.target.value = "";
      return;
    }
    if (!/\.(pdf|doc|docx|xls|xlsx)$/i.test(archivo.name)) {
      setError("Seleccione un formato PDF, Word o Excel.");
      e.target.value = "";
      return;
    }
    setError(null);
    try {
      setPlantillaGuardando(idDocumentoTipo);
      await uploadPlantilla(idDocumentoTipo, archivo);
      setTiposDocumento(await getTiposDocumento("INGRESO"));
      setOk(`Formato actualizado: ${archivo.name}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el formato");
    } finally {
      setPlantillaGuardando(null);
      e.target.value = "";
    }
  };

  const requisitosObligatorios = Array.from(new Set(
    documentosRevision
      .filter((doc) => doc.obligatorio && doc.incluidoEnChecklist)
      .map((doc) => doc.idDocumentoTipo),
  ));
  const documentosAprobados = requisitosObligatorios.filter((idDocumentoTipo) =>
    documentosRevision.some((doc) =>
      doc.idDocumentoTipo === idDocumentoTipo
      && doc.archivoDisponible
      && doc.estado === "APROBADA",
    ),
  ).length;
  const progresoDocumental = requisitosObligatorios.length
    ? Math.round((documentosAprobados / requisitosObligatorios.length) * 100)
    : 0;
  const documentosSalidaActivos = documentosRevision.filter(
    (documento) => documento.tipo === "SALIDA" && documento.incluidoEnChecklist,
  );
  const documentosRevisionVisibles = [
    ...documentosRevision.filter((documento) => documento.tipo !== "SALIDA"),
    ...documentosSalidaActivos,
  ];

  return (
    <div className="reservation-page">
      <div className="section-heading">
        <span className="section-heading__eyebrow">Talento humano</span>
        <h2>Gestión de Talento Humano</h2>
        <p>
          Cree usuarios, dé seguimiento a sus documentos y administre los estados
          de vinculación desde secciones separadas.
        </p>
      </div>

      <div className="tabs-container" role="tablist" aria-label="Módulos de Talento Humano">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ingreso"}
          className={`tab ${tab === "ingreso" ? "active" : ""}`}
          onClick={() => setTab("ingreso")}
        >
          Ingreso de personal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "documentos"}
          className={`tab ${tab === "documentos" ? "active" : ""}`}
          onClick={() => setTab("documentos")}
        >
          Documentos de usuarios
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "formatos"}
          className={`tab ${tab === "formatos" ? "active" : ""}`}
          onClick={() => setTab("formatos")}
        >
          Formatos institucionales
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "salida"}
          className={`tab ${tab === "salida" ? "active" : ""}`}
          onClick={() => setTab("salida")}
        >
          Desvinculación
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "capacitacion"}
          className={`tab ${tab === "capacitacion" ? "active" : ""}`}
          onClick={() => setTab("capacitacion")}
        >
          Capacitación
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "usuarios"}
          className={`tab ${tab === "usuarios" ? "active" : ""}`}
          onClick={() => setTab("usuarios")}
        >
          Bloquear / reactivar
        </button>
      </div>

      <div className="reserva-layout reserva-layout--compact">
        <div className="reserva-content">
          <div className="form-panel flow-stack">
            {error && <p className="error" role="alert">{error}</p>}
            {ok && <p className="success-message" role="status">{ok}</p>}

            {tab === "ingreso" && (
              <section className="flow-stack" role="tabpanel">
                <h3>Verificar cédula e iniciar ingreso</h3>
                <p>
                  Se consulta primero la base de datos. El sistema activa el perfil de
                  servidor municipal y asigna automáticamente la etapa de Selección.
                </p>
                <form onSubmit={verificarUsuario} className="form-grid-2">
                  <div className="field">
                    <label htmlFor="th-cedula">Cédula</label>
                    <input
                      id="th-cedula"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedula}
                      onChange={(e) => {
                        setCedula(e.target.value.replace(/\D/g, ""));
                        setCedulaVerificada("");
                        setUsuarioExiste(null);
                        setNombres("");
                      }}
                      placeholder="10 dígitos"
                      required
                    />
                  </div>
                  <button className="actions" disabled={loading}>
                    {loading ? "Verificando..." : "Verificar cédula"}
                  </button>
                </form>
                {cedulaVerificada === cedula && usuarioExiste === false && (
                  <div className="field">
                    <label htmlFor="th-nombres">Nombres completos</label>
                    <input
                      id="th-nombres"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Ingrese nombres"
                      required
                    />
                  </div>
                )}
                {cedulaVerificada === cedula && usuarioExiste !== null && (
                  <button
                    type="button"
                    className="actions"
                    disabled={loading || !checklistsIngreso.length}
                    onClick={() => void crearUsuario()}
                  >
                    {loading
                      ? "Iniciando..."
                      : usuarioExiste
                        ? "Activar perfil e iniciar ingreso"
                        : "Crear servidor e iniciar ingreso"}
                  </button>
                )}
                {checklistsIngreso.length === 0 && (
                  <p className="error">No hay checklists de ingreso cargados en la base.</p>
                )}
              </section>
            )}

            {tab === "documentos" && (
              <section className="flow-stack" role="tabpanel">
                <h3>Seguimiento y revisión de documentos</h3>
                <form onSubmit={cargarDocumentosRevision} className="form-grid-2">
                  <div className="field">
                    <label htmlFor="th-cedula-revision">Cédula del servidor</label>
                    <input
                      id="th-cedula-revision"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedulaRevision}
                      onChange={(e) => {
                        setCedulaRevision(e.target.value.replace(/\D/g, ""));
                        setCedulaConsultada("");
                        setDocumentosRevision([]);
                        setObservacionesRevision({});
                      }}
                      required
                    />
                  </div>
                  <button className="actions">Consultar documentos</button>
                </form>

                {cedulaConsultada === cedulaRevision && documentosRevisionVisibles.length > 0 && (
                  <>
                    <div className="progress-summary">
                      <strong>
                        Avance de requisitos obligatorios: {documentosAprobados}/
                        {requisitosObligatorios.length} ({progresoDocumental}%)
                      </strong>
                      <progress value={progresoDocumental} max={100}>
                        {progresoDocumental}%
                      </progress>
                    </div>
                    <div className="table-responsive">
                      <table className="reservas-table">
                        <thead>
                          <tr>
                            <th>Documento</th>
                            <th>Proceso</th>
                            <th>Estado</th>
                            <th>Observación</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentosRevisionVisibles.map((doc, index) => (
                            <Fragment key={doc.id}>
                            {index === 0 && doc.tipo !== "SALIDA" && (
                              <tr className="document-group-row">
                                <th colSpan={5}>Documentación de ingreso y permanencia</th>
                              </tr>
                            )}
                            {doc.tipo === "SALIDA"
                              && (index === 0 || documentosRevisionVisibles[index - 1].tipo !== "SALIDA")
                              && (
                                <tr className="document-group-row">
                                  <th colSpan={5}>Documentos de desvinculación — proceso activo</th>
                                </tr>
                              )}
                            <tr key={doc.id}>
                              <td>
                                {doc.nombre}
                                {doc.obligatorio && <span className="required-label">Obligatorio</span>}
                              </td>
                              <td>{doc.tipo}</td>
                              <td>
                                <span className={`status-pill ${
                                  !doc.archivoDisponible
                                    ? "status-pill--pending"
                                    : doc.estado === "PENDIENTE"
                                      ? "status-pill--info"
                                      : doc.estado === "APROBADA"
                                        ? "status-pill--success"
                                        : "status-pill--danger"
                                }`}>
                                  {!doc.archivoDisponible
                                    ? "Pendiente de carga"
                                    : doc.estado === "PENDIENTE"
                                      ? "En revisión"
                                      : doc.estado === "APROBADA"
                                        ? "Aprobado"
                                        : "Observado"}
                                </span>
                              </td>
                              <td>
                                {doc.archivoDisponible && doc.estado === "PENDIENTE" ? (
                                  <input
                                    value={observacionesRevision[doc.id] ?? ""}
                                    placeholder="Comentario si observa"
                                    onChange={(e) => setObservacionesRevision((actual) => ({
                                      ...actual,
                                      [doc.id]: e.target.value,
                                    }))}
                                  />
                                ) : (doc.observacionRevision || "-")}
                              </td>
                              <td>
                                <div className="table-actions">
                                  {doc.archivoDisponible && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn"
                                        onClick={() => verDocumento(doc.id)}
                                      >
                                        Visualizar
                                      </button>
                                      <button
                                        type="button"
                                        className="btn"
                                        onClick={() => descargarArchivo(doc.id, doc.archivoExtension)}
                                      >
                                        Descargar
                                      </button>
                                    </>
                                  )}
                                  {doc.archivoDisponible && doc.estado === "PENDIENTE" && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={() => revisarDocumento(doc.id, "APROBADA")}
                                      >
                                        Aprobar
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-warning"
                                        disabled={!observacionesRevision[doc.id]?.trim()}
                                        onClick={() => revisarDocumento(doc.id, "RECHAZADO")}
                                      >
                                        Observar
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {cedulaConsultada === cedulaRevision && documentosRevisionVisibles.length === 0 && (
                  <p>No hay documentos del proceso actual para esta cédula.</p>
                )}

              </section>
            )}

            {tab === "formatos" && (
              <section className="flow-stack template-manager" role="tabpanel">
                <h3>Formatos institucionales de ingreso</h3>
                <p>
                  Administre únicamente los siete formatos oficiales. Los servidores
                  podrán descargarlos desde el requisito correspondiente de su checklist.
                </p>
                {tiposDocumento.length === 0 && (
                  <p>No se encontraron los documentos autorizados para cargar formatos.</p>
                )}
                {tiposDocumento.map((documento) => (
                  <div className="template-row" key={documento.idDocumentoTipo}>
                    <div>
                      <strong>{documento.nombre}</strong>
                      <span>
                        {documento.plantillaDisponible
                          ? `Formato cargado: ${documento.plantillaNombre}`
                          : "Sin formato cargado"}
                      </span>
                    </div>
                    <label className="file-upload-button">
                      {plantillaGuardando === documento.idDocumentoTipo
                        ? "Cargando..."
                        : documento.plantillaDisponible
                          ? "Actualizar formato"
                          : "Cargar formato"}
                      <input
                        type="file"
                        accept={documento.nombre.includes("Formulario 107") ? ".xlsx" : ".docx"}
                        disabled={plantillaGuardando !== null}
                        onChange={(e) => guardarPlantilla(documento.idDocumentoTipo, e)}
                      />
                    </label>
                  </div>
                ))}
              </section>
            )}

            {tab === "salida" && (
              <section className="flow-stack" role="tabpanel">
                <h3>Iniciar checklist de desvinculación</h3>
                <p>
                  Ingrese la cédula y el motivo. El servidor podrá completar el checklist
                  de desvinculación antes de que su cuenta quede inactiva.
                </p>
                <form onSubmit={iniciarProcesoUsuario} className="form-grid-2">
                  <div className="field">
                    <label htmlFor="th-cedula-proceso">Cédula</label>
                    <input
                      id="th-cedula-proceso"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedulaProceso}
                      onChange={(e) => setCedulaProceso(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                  <div className="field span-2">
                    <label htmlFor="th-motivo-desvinculacion">Motivo de desvinculación</label>
                    <textarea
                      id="th-motivo-desvinculacion"
                      rows={3}
                      value={motivoDesvinculacion}
                      onChange={(e) => setMotivoDesvinculacion(e.target.value)}
                      required
                    />
                  </div>
                  <button className="actions span-2">
                    Iniciar desvinculación
                  </button>
                  {errorProceso && <p className="error span-2">{errorProceso}</p>}
                  {mensajeProceso && <p className="success-message span-2">{mensajeProceso}</p>}
                </form>
              </section>
            )}

            {tab === "capacitacion" && (
              <section className="flow-stack" role="tabpanel">
                <h3>Habilitar carga de certificados de capacitación</h3>
                <p>
                  Inicie Permanencia para que el servidor cargue sus certificados desde
                  su perfil. Puede agrupar varios certificados en un solo archivo.
                </p>
                <form onSubmit={iniciarCapacitacion} className="form-grid-2">
                  <div className="field">
                    <label htmlFor="th-cedula-capacitacion">Cédula</label>
                    <input
                      id="th-cedula-capacitacion"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedulaCapacitacion}
                      onChange={(e) => setCedulaCapacitacion(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                  <button className="actions" type="submit">
                    Habilitar carga
                  </button>
                </form>
                {errorProceso && <p className="error" role="alert">{errorProceso}</p>}
                {mensajeProceso && <p className="success-message" role="status">{mensajeProceso}</p>}
              </section>
            )}

            {tab === "usuarios" && (
              <section className="flow-stack" role="tabpanel">
                <h3>Bloquear o reactivar un usuario</h3>
                <p>
                  Cambia únicamente el estado de acceso; los documentos y procesos
                  históricos se conservan. Los procesos de ingreso o desvinculación
                  activos mantienen el acceso necesario para completar el checklist.
                </p>
                <form onSubmit={cargarEstadoLaboral} className="form-grid-2">
                  <div className="field">
                    <label htmlFor="th-cedula-estado">Cédula</label>
                    <input
                      id="th-cedula-estado"
                      inputMode="numeric"
                      maxLength={10}
                      value={cedulaEstado}
                      onChange={(e) => setCedulaEstado(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                  <button className="actions" disabled={cargandoEstado}>
                    {cargandoEstado ? "Consultando..." : "Consultar usuario"}
                  </button>
                </form>
                {estadoLaboral && (
                  <div className="employment-status-card">
                    <div>
                      <strong>{estadoLaboral.nombres}</strong>
                      <span>{estadoLaboral.cedula}</span>
                    </div>
                    <span className={`status-pill ${estadoLaboral.activo
                      ? "status-pill--success"
                      : "status-pill--danger"}`}>
                      {estadoLaboral.activo ? "Activo" : "Bloqueado / inactivo"}
                    </span>
                    <div className="table-actions">
                      {estadoLaboral.activo ? (
                        <button
                          type="button"
                          className="btn-warning"
                          disabled={cargandoEstado}
                          onClick={() => cambiarEstadoLaboral(false)}
                        >
                          Bloquear usuario
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={cargandoEstado}
                          onClick={() => cambiarEstadoLaboral(true)}
                        >
                          Reactivar usuario
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {errorEstado && <p className="error" role="alert">{errorEstado}</p>}
                {mensajeEstado && <p className="success-message" role="status">{mensajeEstado}</p>}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
