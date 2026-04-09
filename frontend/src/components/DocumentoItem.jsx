import { descargarContrato } from "../services/talentoHumanoService";

export default function DocumentoItem({ doc, usuario }) {
  const descargar = () => {
    descargarContrato(usuario.nombres, usuario.cedula);
  };

  return (
    <div>
      <span>{doc.nombre}</span>

      {doc.esFormato && <button onClick={descargar}>Descargar formato</button>}
    </div>
  );
}
