import { cloneElement, type HTMLAttributes, type ReactElement } from "react";
import { createPortal } from "react-dom";

type ModalContent = HTMLAttributes<HTMLDivElement>;

type ModalPortalProps = {
  children: ReactElement<ModalContent>;
};

export default function ModalPortal({ children }: ModalPortalProps) {
  return createPortal(
    <div className="modal-overlay">
      {cloneElement(children, {
        role: "dialog",
        "aria-modal": true,
        "aria-label": children.props["aria-label"] ?? "Ventana de diálogo",
      })}
    </div>,
    document.body,
  );
}
