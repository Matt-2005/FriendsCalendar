// app/account/AccountForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initial: { email: string; pseudo: string; avatarUrl: string | null } };

export default function AccountForm({ initial }: Props) {
  const r = useRouter();
  const [email, setEmail] = useState(initial.email);
  const [pseudo, setPseudo] = useState(initial.pseudo);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null); setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          pseudo: pseudo.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setErr(j.error ?? "Erreur serveur");
      else { setOk("Profil mis à jour"); setCurrentPassword(""); setNewPassword(""); r.refresh(); }
    } catch { setErr("Erreur réseau"); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(e: React.FormEvent) {
    e.preventDefault();
    if (!avatarFile) return;
    setErr(null); setOk(null); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setErr(j.error ?? "Erreur upload");
      else { setOk("Avatar mis à jour"); setAvatarFile(null); r.refresh(); }
    } catch { setErr("Erreur réseau"); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Avatar */}
      <form onSubmit={uploadAvatar} style={{ display: "grid", gap: 8 }}>
        <label>Photo de profil</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={avatarFile ? URL.createObjectURL(avatarFile) : (initial.avatarUrl ?? "/default-avatar.png")}
            alt="Avatar"
            style={{ width: 64, height: 64, borderRadius: 999, objectFit: "cover", border: "1px solid #e5e7eb" }}
          />
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
          <button type="submit" disabled={!avatarFile || uploading}>
            {uploading ? "…" : "Mettre à jour l’avatar"}
          </button>
        </div>
      </form>

      {/* Profil */}
      <form onSubmit={saveProfile} style={{ display: "grid", gap: 8 }}>
        <label>Pseudo</label>
        <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />

        <details>
          <summary>Changer le mot de passe</summary>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <input type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
            <input type="password" placeholder="Nouveau mot de passe (≥ 6)" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
          </div>
        </details>

        <button type="submit" disabled={saving}>
          {saving ? "…" : "Enregistrer"}
        </button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
      {ok && <p style={{ color: "seagreen" }}>{ok}</p>}
    </div>
  );
}
