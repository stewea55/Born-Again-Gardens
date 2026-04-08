"use client";

export default function DeleteConfirmModal({
  open,
  title = "Confirm deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3 className="subtitle">{title}</h3>
        <p className="paragraph">{message}</p>
        <div className="modal-actions">
          <button type="button" className="menu-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
