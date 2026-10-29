"use client";

import { useState } from "react";
import Link from "next/link";
import Sheet from "./Sheet";
import { useToast } from "./Toast";

type Choice = { id: number; name: string; isMember: boolean; members: number; pending: number };

/** Pastille « 👥 Groupe ▾ » : pour changer de groupe quand on en a plusieurs (ou pour le super admin) */
export default function GroupSwitcher({
  current,
  groups,
  superAdmin = false,
}: {
  current: { id: number; name: string };
  groups: Choice[];
  superAdmin?: boolean;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  // Un seul groupe : rien à choisir, on garde l'écran simple
  if (groups.length < 2 && !superAdmin) return null;

  async function pick(id: number) {
    if (id === current.id) return setOpen(false);
    setBusy(id);
    const res = await fetch("/api/groups/active", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id }),
    }).catch(() => null);
    if (!res?.ok) {
      setBusy(null);
      return toast("Impossible de changer de groupe");
    }
    // Rechargement complet : aucune page de l'ancien groupe ne reste en mémoire
    window.location.href = "/events";
  }

  return (
    <>
      <button type="button" className="group-pill" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span aria-hidden>👥</span>
        <span className="ellipsis">{current.name}</span>
        <span aria-hidden className="group-pill-caret">▾</span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Changer de groupe">
        <div className="card list-card">
          {groups.map((g) => (
            <button key={g.id} type="button" className="list-item" onClick={() => pick(g.id)} disabled={busy !== null}>
              <span className="group-avatar" aria-hidden>
                {g.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="grow">
                <div style={{ fontWeight: 650 }}>{g.name}</div>
                <div className="small muted">
                  {g.members} membre{g.members > 1 ? "s" : ""}
                  {superAdmin && !g.isMember ? " · tu n'en fais pas partie" : ""}
                </div>
              </div>
              {superAdmin && g.pending > 0 && <span className="badge badge-pending">{g.pending} en attente</span>}
              {busy === g.id ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : g.id === current.id ? (
                <span style={{ color: "var(--primary)", fontWeight: 800 }}>✓</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="stack" style={{ gap: 8, marginTop: 14 }}>
          <Link href="/join" className="btn btn-outline btn-block">
            🔑 Rejoindre un autre groupe avec un code
          </Link>
          {superAdmin && (
            <Link href="/account#groupes" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
              ＋ Créer un groupe
            </Link>
          )}
        </div>
      </Sheet>
    </>
  );
}
