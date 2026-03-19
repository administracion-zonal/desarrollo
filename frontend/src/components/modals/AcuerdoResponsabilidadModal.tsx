import { useEffect, useState } from "react";
import "./AcuerdoResponsabilidadModal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
}

export default function AcuerdoResponsabilidadModal({
  open,
  onClose,
  onAccept,
}: Props) {
  const [checked, setChecked] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setChecked(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-container">
      <div className="modal-content">
        <h3>Acuerdo de responsabilidad</h3>

        <div className="modal-body">
          <iframe src="/src/assets/documentos/acuerdo.pdf" title="Acuerdo" />
        </div>

        <div className="modal-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            Acepto haber leído el contenido del Acuerdo de Responsabilidad y Uso
            de Medios Electrónicos
          </span>

          <button type="button" className="btn-outline" onClick={onClose}>
            Cancelar
          </button>

          <button
            type="button"
            className="btn-primary"
            disabled={!checked || guardando}
            onClick={async () => {
              try {
                setGuardando(true);
                await onAccept();
                onClose();
              } finally {
                setGuardando(false);
              }
            }}
          >
            {guardando ? "Guardando..." : "Acepto"}
          </button>
        </div>
      </div>
    </div>
  );
}
