"use client";

import { useState } from "react";
import Avatar from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

type Member = { id: number; pseudo: string; email: string; avatarUrl: string | null };

export default function MembersAdmin({ members, meId }: { members: Member[]; meId: number }) {
  const toast = useToast();
  const [target, setTarget] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ pseudo: string; password: string } | null>(null);

  async function reset() {
    if (!target) return;
    setBusy(true);
    const res = await fetch(`/api/admin/members/${target.id}/reset-password`, { method: "POST" }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (!res?.ok) return toast(j?.error ?? "Échec");
    setResult({ pseudo: target.pseudo, password: j.password });
    setTarget(null);
  }

  return (
    <>
      {result && (
        <div className="alert alert-success" style={{ marginBottom: 10, flexDirection: "column" }}>
          <span>
            Nouveau mot de passe de <strong>{result.pseudo}</strong> :
          </span>
          <code style={{ fontSize: 18, fontWeight: 800 }}>{result.password}</code>
          <span className="small">Envoie-le-lui, il pourra le changer depuis son profil.</span>
        </div>
      )}
      <div className="card list-card">
        {members.map((m) => (
          <div key={m.id} className="list-item">
            <Avatar user={m} size={36} />
            <div className="grow">
              <div style={{ fontWeight: 650 }}>{m.pseudo}</div>
              <div className="small muted ellipsis">{m.email}</div>
            </div>
            {m.id !== meId && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setTarget(m)}>
                Mot de passe
              </button>
            )}
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={target !== null}
        title={`Réinitialiser le mot de passe de ${target?.pseudo} ?`}
        text="Un mot de passe provisoire sera créé. L'ancien ne marchera plus."
        confirmLabel="Réinitialiser"
        loading={busy}
        onConfirm={reset}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
