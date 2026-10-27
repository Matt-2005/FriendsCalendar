"use client";

import { createPortal } from "react-dom";
import { useLockBody } from "./Sheet";

export default function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Confirmer",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text?: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useLockBody(open);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="dialog-backdrop" onClick={loading ? undefined : onCancel}>
      <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">{title}</h2>
        {text && <p className="dialog-text">{text}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Annuler
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger-solid" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
