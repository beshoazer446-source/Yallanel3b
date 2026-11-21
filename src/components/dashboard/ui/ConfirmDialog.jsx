import { useEffect, useId, useRef } from "react";

// نافذة تأكيد مبنية على <dialog>، فالمتصفح بيهتم بالـ focus والـ Esc.
// open: ظاهرة ولا لأ. onCancel بتتنادى بـ Esc أو الضغط بره أو زرار الإلغاء.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
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
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div className="dash-dialog-body">
        <h2 className="dash-dialog-title" id={titleId}>
          {title}
        </h2>
        {message ? <p className="dash-dialog-message">{message}</p> : null}
        <div className="dash-dialog-actions">
          <button
            type="button"
            className={`dash-btn ${danger ? "dash-btn-danger" : "dash-btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
