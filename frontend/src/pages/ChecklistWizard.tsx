import { useCallback, useEffect, useMemo, useState } from "react";
import ChecklistTabla from "../components/ChecklistTabla";
import {
  descargarDocumento,
  descargarPlantilla,
  finalizarProceso,
  getDocumentos,
  getIngresoAprobado,
  getProcesoActual,
  uploadDocumento,
} from "../services/talentoHumanoService";
import type {
  DocumentoTH,
  ProcesoUsuario,
} from "../services/talentoHumanoService";

export default function ChecklistWizard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const idUsuario: number | undefined = user?.idUsuario;

  const [proceso, setProceso] = useState<ProcesoUsuario | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoTH[]>([]);
  const [ingresoAprobado, setIngresoAprobado] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const documentosProceso = useMemo(
    () => documentos.filter(
      (documento) => documento.tipo === proceso?.tipo && documento.incluidoEnChecklist,
    ),
    [documentos, proceso],
  );
  const documentosHistorial = documentos.filter(
    (documento) => documento.archivoDisponible && documento.estado === "APROBADA",
  );
  const documentosObligatorios = documentosProceso.filter(
    (documento) => documento.obligatorio,
  );
  const requisitosObligatorios = Array.from(
    new Set(documentosObligatorios.map((documento) => documento.idDocumentoTipo)),
  );
  const documentosAprobados = requisitosObligatorios.filter((idDocumentoTipo) =>
    documentosProceso.some((documento) =>
      documento.idDocumentoTipo === idDocumentoTipo
      && documento.estado === "APROBADA"
      && documento.archivoDisponible,
    ),
  ).length;
  const documentosSubidosSinAprobar = documentosProceso.some(
    (documento) => documento.archivoDisponible && documento.estado !== "APROBADA",
  );
  const progreso = requisitosObligatorios.length
    ? Math.round((documentosAprobados / requisitosObligatorios.length) * 100)
    : 0;
  const puedeFinalizar =
    proceso?.idChecklist !== null &&
    requisitosObligatorios.length > 0 &&
    !documentosSubidosSinAprobar &&
    requisitosObligatorios.every((idDocumentoTipo) =>
      documentosProceso.some((documento) =>
        documento.idDocumentoTipo === idDocumentoTipo
        && documento.estado === "APROBADA"
        && documento.archivoDisponible,
      ),
    );

  const cargar = useCallback(async () => {
    if (!idUsuario) return;
    setLoading(true);
    setError(null);
    try {
      const [procesoActual, docs, aprobado] = await Promise.all([
        getProcesoActual(),
        getDocumentos(idUsuario),
        getIngresoAprobado(),
      ]);
      setProceso(procesoActual);
      setDocumentos(docs);
      setIngresoAprobado(aprobado);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el proceso");
    } finally {
      setLoading(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const subir = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idDocumentoTipo: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el límite de 10 MB.");
      e.target.value = "";
      return;
    }
    if (!/\.(pdf|doc|docx|xls|xlsx)$/i.test(file.name)) {
      setError("Seleccione un archivo PDF, Word o Excel.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("idDocumentoTipo", String(idDocumentoTipo));

    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      await uploadDocumento(formData);
      setMensaje("Documento cargado. Queda pendiente de revisión.");
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el documento");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const verDocumento = async (id: number, extension: string) => {
    const ventana = window.open("about:blank", "_blank");
    if (!ventana) {
      setError("Permita ventanas emergentes para visualizar el documento.");
      return;
    }
    try {
      const blob = await descargarDocumento(id);
      const url = URL.createObjectURL(blob);
      ventana.document.title = `Documento ${extension.toUpperCase()}`;
      ventana.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      ventana.close();
      setError(e instanceof Error ? e.message : "No se pudo abrir el documento");
    }
  };

  const descargarFormato = async (idDocumentoTipo: number, nombre?: string | null) => {
    try {
      const blob = await descargarPlantilla(idDocumentoTipo);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nombre || `formato-documento-${idDocumentoTipo}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el formato");
    }
  };

  const finalizar = async () => {
    if (!proceso || !idUsuario || proceso.idChecklist === null || !puedeFinalizar) return;
    setLoading(true);
    setError(null);
    try {
      const siguiente = await finalizarProceso({
        idUsuario,
        idChecklist: proceso.idChecklist,
        tipo: proceso.tipo,
      });
      if (siguiente) {
        setProceso(siguiente);
        setMensaje(`Etapa completada. Continúe con: ${siguiente.nombreChecklist}.`);
        await cargar();
      } else {
        setMensaje("Proceso completado correctamente.");
        window.location.assign("/checklist");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo finalizar el proceso");
    } finally {
      setLoading(false);
    }
  };

  if (!idUsuario) {
    return <div style={{ padding: 20 }}>Usuario no identificado.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Proceso de Talento Humano</h2>
      {loading && <p>Procesando...</p>}
      {error && <p className="error">{error}</p>}
      {mensaje && <p className="success-message">{mensaje}</p>}

      {!proceso && ingresoAprobado && !loading && !error && (
        <section className="checklist-completed">
          <span className="section-heading__eyebrow">Estado de vinculación</span>
          <h3>Documentación aprobada</h3>
          <p>Su proceso de ingreso finalizó. Los documentos aprobados se muestran solo para consulta.</p>
          {documentosHistorial.length === 0 && <p>No hay documentos aprobados para mostrar.</p>}
        </section>
      )}

      {!proceso && ingresoAprobado === false && !loading && !error && (
        <p>No tiene un proceso activo. Consulte con Talento Humano.</p>
      )}

      {!proceso && ingresoAprobado && documentosHistorial.length > 0 && (
        <section>
          <h3>Documentos aprobados</h3>
          <div className="table-responsive">
            <table className="reservas-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Proceso</th>
                  <th>Estado</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {documentosHistorial.map((documento) => (
                  <tr key={documento.id}>
                    <td>{documento.nombre}</td>
                    <td>
                      <span className="status-pill status-pill--success">Aprobado</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => verDocumento(documento.id, documento.archivoExtension)}
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {proceso && (
        <>
          <p>
            Proceso: <strong>{proceso.nombreChecklist || proceso.tipo}</strong>
          </p>
          <div style={{ marginBottom: 20 }}>
            <strong>
              Documentación aprobada: {documentosAprobados}/
              {requisitosObligatorios.length} ({progreso}%)
            </strong>
            <div
              style={{
                height: 10,
                background: "#ccc",
                borderRadius: 5,
                marginTop: 5,
              }}
            >
              <div
                style={{
                  width: `${progreso}%`,
                  height: "100%",
                  background: "green",
                  borderRadius: 5,
                }}
              />
            </div>
          </div>

          {documentosProceso.length === 0 ? (
            <p>No hay documentos configurados para este proceso.</p>
          ) : (
            <ChecklistTabla
              items={documentosProceso}
              onUpload={subir}
              onView={verDocumento}
              onDownloadTemplate={descargarFormato}
            />
          )}

          {proceso.idChecklist === null && (
            <p>El proceso aún no tiene un checklist asociado. Contacte a Talento Humano.</p>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={finalizar}
            disabled={loading || !puedeFinalizar}
            style={{ marginTop: 20 }}
          >
            {loading ? "Procesando..." : "Finalizar proceso"}
          </button>
        </>
      )}
    </div>
  );
}
