"use client";

import { useState } from "react";
import Avatar from "./Avatar";

/** Bandeau visible partout pendant une simulation */
export default function SimulationBanner({
  user,
  adminPseudo,
}: {
  user: { pseudo: string; avatarUrl: string | null };
  adminPseudo: string;
}) {
  const [busy, setBusy] = useState(false);

  async function stop() {
    setBusy(true);
    await fetch("/api/admin/simulate", { method: "DELETE" }).catch(() => {});
    // Rechargement complet pour vider les pages gardées en mémoire
    window.location.href = "/account";
  }

  return (
    <div className="sim-banner" role="status">
      <Avatar user={user} size={28} />
      <div className="grow">
        <strong>Tu es dans la peau de {user.pseudo}</strong>
        <div className="sim-sub">Tout ce que tu fais compte vraiment pour {user.pseudo}</div>
      </div>
      <button type="button" className="sim-stop" onClick={stop} disabled={busy} aria-label={`Revenir au compte de ${adminPseudo}`}>
        {busy ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Revenir à moi"}
      </button>
    </div>
  );
}
