"use client";

import { useRefresh } from "./useRefresh";
import { useToast } from "./Toast";

/** Bouton "Rafraîchir" en bas d'une liste, avec l'heure de la dernière mise à jour */
export default function RefreshButton({ updatedAt }: { updatedAt: string }) {
  const { refresh, refreshing } = useRefresh();
  const toast = useToast();

  return (
    <div className="refresh-footer">
      <button
        type="button"
        className="btn btn-outline"
        onClick={async () => {
          await refresh();
          toast("C'est à jour ✓");
        }}
        disabled={refreshing}
      >
        <span className={`refresh-icon ${refreshing ? "is-spinning" : ""}`} aria-hidden>
          ↻
        </span>
        {refreshing ? "Mise à jour…" : "Rafraîchir"}
      </button>
      <p className="hint">Mis à jour à {updatedAt}</p>
    </div>
  );
}
