"use client";

import { useState } from "react";
import { useToast } from "../../components/Toast";

type Choice = { id: number; name: string; isMember: boolean; members: number; pending: number };

/** Super admin : tous les groupes, basculer de l'un à l'autre, en créer */
export default function AllGroups({ groups, currentId }: { groups: Choice[]; currentId: number }) {
  const toast = useToast();
  const [busy, setBusy] = useState<number | "create" | null>(null);
  const [name, setName] = useState("");
  const [join, setJoin] = useState(false);

  async function pick(id: number) {
    if (id === currentId) return;
    setBusy(id);
    const res = await fetch("/api/groups/active", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: id }),
    }).catch(() => null);
    if (!res?.ok) return setBusy(null), toast("Impossible de changer de groupe");
    window.location.href = "/account#groupe";
    window.location.reload();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, join }),
    }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    if (!res?.ok) return setBusy(null), toast(j?.error ?? "Échec, réessaie");
    // Le nouveau groupe devient le groupe affiché : son code apparaît juste au-dessus
    window.location.href = "/account#groupe";
    window.location.reload();
  }

  return (
    <>
      <div className="card list-card">
        {groups.map((g) => (
          <button key={g.id} type="button" className="list-item" onClick={() => pick(g.id)} disabled={busy !== null}>
            <span className="group-avatar" aria-hidden>
              {g.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="grow" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650 }} className="ellipsis">{g.name}</div>
              <div className="small muted">
                {g.members} membre{g.members > 1 ? "s" : ""}
                {!g.isMember ? " · tu n'en fais pas partie" : ""}
              </div>
            </div>
            {g.pending > 0 && <span className="badge badge-pending">{g.pending} en attente</span>}
            {busy === g.id ? (
              <span className="spinner" style={{ width: 16, height: 16 }} />
            ) : g.id === currentId ? (
              <span className="badge badge-neutral">affiché</span>
            ) : (
              <span className="list-item-chevron">›</span>
            )}
          </button>
        ))}
      </div>

      <form className="card" style={{ marginTop: 12 }} onSubmit={create}>
        <div className="card-title">＋ Nouveau groupe</div>
        <p className="card-text" style={{ marginBottom: 12 }}>
          Pour une autre bande de potes ou une asso. Un code d'invitation est créé automatiquement.
        </p>
        <div className="field">
          <label htmlFor="new-group" className="label">Nom du groupe</label>
          <input id="new-group" className="input" placeholder="Ex : Club de rando" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </div>
        <label className="row" style={{ gap: 10, marginTop: 12, fontSize: 15 }}>
          <input type="checkbox" checked={join} onChange={(e) => setJoin(e.target.checked)} style={{ width: 20, height: 20 }} />
          J'en fais partie (je reçois ses sorties et ses notifications)
        </label>
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy !== null || !name.trim()}>
          {busy === "create" ? <span className="spinner" /> : "Créer le groupe"}
        </button>
      </form>
    </>
  );
}
