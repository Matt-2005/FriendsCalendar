"use client";

import { useState } from "react";

export default function AccountForm({
  initialEmail,
  initialPseudo,
  initialAvatarUrl,
}: {
  initialEmail: string;
  initialPseudo: string;
  initialAvatarUrl: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [pseudo, setPseudo] = useState(initialPseudo);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pseudo }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Erreur de sauvegarde");
      return;
    }
    setMsg("Modifications enregistrées.");
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploading(true); setMsg(null);
    const fd = new FormData();
    fd.append("file", e.target.files[0]);
    const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(j.error ?? "Upload échoué");
      return;
    }
    const j = await res.json();
    setAvatarUrl(j.url);
    setMsg("Avatar mis à jour.");
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h3>Informations personnelles</h3>

      <form onSubmit={onSave} style={{ display: "grid", gap: 10 }}>
        <label>
          Pseudo
          <input value={pseudo} onChange={e => setPseudo(e.target.value)} />
        </label>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid #e5e7eb" }}
            />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: 12, border: "1px solid #e5e7eb", display: "grid", placeItems: "center" }}>
              ?
            </div>
          )}
          <label style={{ display: "inline-block" }}>
            <span style={{ display: "block", marginBottom: 4 }}>Photo de profil</span>
            <input type="file" accept="image/*" onChange={onUpload} />
          </label>
        </div>

        <button type="submit" disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
        {uploading && <div>Upload en cours…</div>}
        {msg && <div style={{ color: "#0a7" }}>{msg}</div>}
      </form>
    </section>
  );
}
