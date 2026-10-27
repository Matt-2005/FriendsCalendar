"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Avatar from "../../components/Avatar";
import { useToast } from "../../components/Toast";
import ImageCropper from "./ImageCropper";
import { errorMessage } from "@/lib/errors";
import styles from "./account.module.css";

export default function AccountForm({
  initialEmail,
  initialPseudo,
  initialAvatarUrl,
  simulating = false,
}: {
  initialEmail: string;
  initialPseudo: string;
  initialAvatarUrl: string;
  simulating?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { update: updateSession } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [pseudo, setPseudo] = useState(initialPseudo);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const dirty = email.trim() !== initialEmail || pseudo.trim() !== initialPseudo;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pseudo }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setErr((await res?.json().catch(() => ({})))?.error ?? "Pas de connexion");
      return;
    }
    if (!simulating) await updateSession({ name: pseudo.trim(), email: email.trim().toLowerCase() });
    toast("Profil enregistré ✓");
    router.refresh();
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Choisis une photo");
    if (file.size > 15 * 1024 * 1024) return toast("Photo trop lourde (15 Mo max)");
    const reader = new FileReader();
    reader.onload = () => setImageToCrop(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropComplete(blob: Blob) {
    setImageToCrop(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error);
      setAvatarUrl(j.url);
      if (!simulating) await updateSession({ avatarUrl: j.url });
      toast("Photo mise à jour ✓");
      router.refresh();
    } catch (e) {
      toast(errorMessage(e, "L'envoi a échoué"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {imageToCrop && <ImageCropper imageSrc={imageToCrop} onCropComplete={handleCropComplete} onCancel={() => setImageToCrop(null)} />}

      <form onSubmit={onSave} className="card">
        <div className={styles.avatarRow}>
          <button type="button" className={styles.avatarButton} onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Changer ma photo">
            <Avatar user={{ pseudo: pseudo || "?", avatarUrl: avatarUrl || null }} size={84} />
            <span className={styles.avatarBadge}>{uploading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "📷"}</span>
          </button>
          <div>
            <div className={styles.name}>{pseudo || "Sans nom"}</div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ paddingInline: 0 }} onClick={() => fileRef.current?.click()} disabled={uploading}>
              {avatarUrl ? "Changer ma photo" : "Ajouter une photo"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileSelect} hidden />
        </div>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="pseudo" className="label">Prénom ou pseudo</label>
          <input id="pseudo" className="input" value={pseudo} maxLength={40} onChange={(e) => setPseudo(e.target.value)} autoComplete="nickname" />
        </div>
        <div className="field">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="email"
          />
        </div>

        {err && <div className="alert alert-error" style={{ marginTop: 12 }}>{err}</div>}

        {dirty && (
          <button type="submit" disabled={saving || !pseudo.trim()} className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            {saving ? <span className="spinner" /> : "Enregistrer"}
          </button>
        )}
      </form>
    </>
  );
}
