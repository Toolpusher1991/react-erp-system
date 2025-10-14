// src/components/ConfirmationModal.tsx
interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "success" | "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  title,
  message,
  confirmText = "Bestätigen",
  cancelText = "Abbrechen",
  type = "info",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "danger":
        return "⚠️";
      case "warning":
        return "⚡";
      case "info":
        return "ℹ️";
      default:
        return "❓";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "confirm-success";
      case "danger":
        return "confirm-danger";
      case "warning":
        return "confirm-warning";
      case "info":
        return "confirm-info";
      default:
        return "";
    }
  };

  return (
    <>
      <div className="confirm-modal-overlay" onClick={onCancel} />
      <div className={`confirm-modal ${getTypeClass()}`}>
        <div className="confirm-modal-icon">
          <span>{getIcon()}</span>
        </div>

        <div className="confirm-modal-content">
          <h2 className="confirm-modal-title">{title}</h2>
          <p className="confirm-modal-message">{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button className="btn-confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`btn-confirm-ok ${getTypeClass()}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmationModal;
