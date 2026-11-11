type Documento = {
  id: number;
  idDocumentoTipo: number;
  nombre: string;
  estado: string;
  archivoDisponible: boolean;
  observacionRevision?: string | null;
  obligatorio: boolean;
  plantillaDisponible: boolean;
  plantillaNombre?: string | null;
  archivoExtension: string;
};

type Props = {
  items: Documento[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
  onView: (id: number, extension: string) => void;
  onDownloadTemplate: (id: number, nombre?: string | null) => void;
};

const estadoDocumento = (documento: Documento) => {
  if (!documento.archivoDisponible) {
    return { texto: "Pendiente de carga", clase: "status-pill--pending" };
  }
  if (documento.estado === "APROBADA") {
    return { texto: "Aprobado", clase: "status-pill--success" };
  }
  if (documento.estado === "PENDIENTE") {
    return { texto: "En revisión", clase: "status-pill--info" };
  }
  return { texto: "Observado", clase: "status-pill--danger" };
};

export default function ChecklistTabla({
  items,
  onUpload,
  onView,
  onDownloadTemplate,
}: Props) {
  const formatos = items.filter((documento) => documento.plantillaDisponible);

  return (
    <div className="checklist-sections">
      {formatos.length > 0 && (
        <section className="checklist-section checklist-section--templates">
          <div className="checklist-section__heading">
            <div>
              <span className="section-heading__eyebrow">Formatos oficiales</span>
              <h3>Formatos de Talento Humano</h3>
            </div>
            <p>Descargue y complete estos formatos antes de cargar su documento.</p>
          </div>
          <div className="checklist-template-list">
            {formatos.map((documento) => (
              <article className="checklist-template-card" key={documento.idDocumentoTipo}>
                <div>
                  <strong>{documento.nombre}</strong>
                  <span>{documento.plantillaNombre || "Formato institucional disponible"}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    onDownloadTemplate(documento.idDocumentoTipo, documento.plantillaNombre)
                  }
                >
                  Descargar formato
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="checklist-section">
        <div className="checklist-section__heading">
          <div>
            <span className="section-heading__eyebrow">Documentación personal</span>
            <h3>Documentos que debe ingresar</h3>
          </div>
          <p>Revise el estado de cada requisito y cargue los documentos pendientes.</p>
        </div>
        <div className="table-responsive">
          <table className="reservas-table checklist-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Requisito</th>
                <th>Estado</th>
                <th>Archivo cargado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((documento) => {
                const estado = estadoDocumento(documento);
                const puedeReemplazar =
                  !documento.archivoDisponible || documento.estado === "RECHAZADO";

                return (
                  <tr key={documento.id}>
                    <td>{documento.nombre}</td>
                    <td>
                      <span className={documento.obligatorio ? "required-label" : "optional-label"}>
                        {documento.obligatorio ? "Obligatorio" : "Opcional"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${estado.clase}`}>{estado.texto}</span>
                      {documento.estado === "RECHAZADO" && documento.observacionRevision && (
                        <p className="checklist-observation">{documento.observacionRevision}</p>
                      )}
                    </td>
                    <td>
                      {documento.archivoDisponible
                        ? `Archivo ${documento.archivoExtension.toUpperCase()}`
                        : "Aún no cargado"}
                    </td>
                    <td>
                      <div className="table-actions">
                        {documento.archivoDisponible && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onView(documento.id, documento.archivoExtension)}
                          >
                            Visualizar
                          </button>
                        )}
                        {puedeReemplazar && (
                          <label className="file-upload-button">
                            {documento.estado === "RECHAZADO" ? "Reemplazar archivo" : "Cargar archivo"}
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                              onChange={(e) => onUpload(e, documento.idDocumentoTipo)}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
