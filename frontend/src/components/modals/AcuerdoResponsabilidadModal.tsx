import { useEffect, useState } from "react";
import acuerdoPdf from "../../assets/documentos/acuerdo.pdf?url";
import "./AcuerdoResponsabilidadModal.css";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>; // (ya lo tienes async)
}>;

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
    <div className="agreement-modal-container">
      <div className="agreement-modal-content">
        <div className="agreement-modal-header-inline">
          <h3>Acuerdo de responsabilidad</h3>
          <button
            type="button"
            className="agreement-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <div className="agreement-modal-body">
          <iframe src={acuerdoPdf} title="Acuerdo" />
        </div>

        <div className="agreement-modal-check">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>
            Acepto haber leído el contenido del Acuerdo de Responsabilidad y Uso
            de Medios Electrónicos
          </span>
        </div>

        <div className="agreement-modal-actions">
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
