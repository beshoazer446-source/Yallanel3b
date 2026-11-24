import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

// نافذة عامة مبنية على <dialog> (نفس أسلوب ConfirmDialog) بمحتوى حر.
export default function Modal({
  open,
  title,
  description,
  onClose,
  closeDisabled = false,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="dash-dialog"
      style={{ width: "min(520px, calc(100vw - 32px))", maxWidth: "none" }}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose();
      }}
    >
      <div className="dash-dialog-body">
        <div className="wallet-modal-head">
          <h2 className="dash-dialog-title" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            className="dash-icon-btn"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="إغلاق"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {description ? <p className="dash-dialog-message">{description}</p> : null}
        {children}
      </div>
    </dialog>
  );
}