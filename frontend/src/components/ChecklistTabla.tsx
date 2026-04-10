type Documento = {
  id: number;
  idDocumentoTipo: number;
  nombre: string;
  estado: string;
  rutaArchivo?: string;
};

type Props = {
  items: Documento[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, id: number) => void;
};

export default function ChecklistTabla({ items, onUpload }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center" }}>LISTADO DE DOCUMENTOS</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid black",
        }}
      >
        <thead>
          <tr>
            <th>#</th>
            <th>DOCUMENTOS</th>
            <th>ESTADO</th>
            <th>ARCHIVO</th>
            <th>SUBIR</th>
          </tr>
        </thead>

        <tbody>
          {items.map((doc, index) => {
            const subido = !!doc.rutaArchivo;

            return (
              <tr key={doc.id}>
                <td>{index + 1}</td>

                <td>{doc.nombre}</td>

                <td style={{ textAlign: "center" }}>
                  {doc.estado === "APROBADA"
                    ? "✔"
                    : doc.estado === "PENDIENTE"
                      ? "⏳"
                      : "❌"}
                </td>

                <td style={{ textAlign: "center" }}>
                  {subido ? "📄 Subido" : "-"}
                </td>

                <td>
                  {subido ? (
                    <span style={{ color: "green" }}>✔ Documento cargado</span>
                  ) : (
                    <input
                      type="file"
                      onChange={(e) => onUpload(e, doc.idDocumentoTipo)}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
