"use client";

import { useState } from "react";
import { useToast } from "../../components/Toast";

export default function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const toast = useToast();
  const [has, setHas] = useState(hasPassword);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" className="card list-item" style={{ borderRadius: "var(--radius-lg)" }} onClick={() => setOpen(true)}>
        <span>
          {has ? "Changer mon mot de passe" : "Créer un mot de passe"}
          {!has && <span className="small muted" style={{ display: "block" }}>Tu te connectes avec Google : c'est facultatif</span>}
        </span>
        <span className="list-item-chevron">›</span>
      </button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setErr((await res?.json().catch(() => ({})))?.error ?? "Pas de connexion");
      return;
    }
    toast(has ? "Mot de passe modifié ✓" : "Mot de passe créé ✓");
    setHas(true);
    setCurrent("");
    setNext("");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="card">
      {has && (
        <div className="field">
          <label className="label" htmlFor="cur-pw">Mot de passe actuel</label>
          <input id="cur-pw" type={show ? "text" : "password"} className="input" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label className="label" htmlFor="new-pw">Nouveau mot de passe</label>
        <div className="input-wrap">
          <input id="new-pw" type={show ? "text" : "password"} className="input" autoComplete="new-password" minLength={8} value={next} onChange={(e) => setNext(e.target.value)} />
          <button type="button" className="input-action" onClick={() => setShow((s) => !s)}>
            {show ? "Cacher" : "Voir"}
          </button>
        </div>
        <span className="hint">8 caractères minimum</span>
      </div>
      {err && <div className="alert alert-error" style={{ marginTop: 12 }}>{err}</div>}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy || (has && !current) || next.length < 8}>
          {busy ? <span className="spinner" /> : "Valider"}
        </button>
      </div>
    </form>
  );
}
