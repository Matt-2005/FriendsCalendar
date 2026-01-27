"use client";

import { useState } from "react";
import styles from "./account.module.css";
import ImageCropper from "./ImageCropper";

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
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(
    null
  );
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, pseudo }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg({ type: "error", text: j.error ?? "Erreur de sauvegarde" });
      return;
    }
    setMsg({ type: "success", text: "Modifications enregistrées avec succès !" });
  }

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    
    // Vérification de la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMsg({ type: "error", text: "Fichier trop volumineux (max 10MB)" });
      e.target.value = "";
      return;
    }
    
    // Vérification du type
    if (!file.type.startsWith("image/")) {
      setMsg({ type: "error", text: "Veuillez sélectionner une image" });
      e.target.value = "";
      return;
    }
    
    // Lire le fichier et afficher le cropper
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    e.target.value = "";
  }

  async function handleCropComplete(croppedBlob: Blob) {
    setImageToCrop(null);
    setUploading(true);
    setMsg({ type: "info", text: "Upload en cours..." });
    
    const fd = new FormData();
    fd.append("file", croppedBlob, "avatar.jpg");
    
    const res = await fetch("/api/account/avatar", { method: "POST", body: fd });
    setUploading(false);
    
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg({ type: "error", text: j.error ?? "Upload échoué" });
      return;
    }
    
    const j = await res.json();
    setAvatarUrl(j.url);
    setMsg({ type: "success", text: "Avatar mis à jour avec succès !" });
  }

  function handleCropCancel() {
    setImageToCrop(null);
  }

  const initial = pseudo?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "?";

  return (
    <>
      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <form onSubmit={onSave} className={styles.form}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarPreview}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>{initial}</div>
            )}
          </div>
          <div className={styles.avatarInfo}>
            <label className={styles.avatarLabel}>Photo de profil</label>
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className={styles.fileInput}
              disabled={uploading}
            />
            {uploading && (
              <p className={styles.messageInfo}>
                <span className={styles.loading}>Upload en cours...</span>
              </p>
            )}
          </div>
        </div>

      <div className={styles.formGroup}>
        <label htmlFor="pseudo" className={styles.label}>
          Pseudo
        </label>
        <input
          id="pseudo"
          type="text"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      {msg && (
        <div
          className={`${styles.message} ${
            msg.type === "success"
              ? styles.messageSuccess
              : msg.type === "error"
              ? styles.messageError
              : styles.messageInfo
          }`}
        >
          {msg.text}
        </div>
      )}

      <button type="submit" disabled={saving} className={styles.submitButton}>
        {saving ? "Enregistrement..." : "Enregistrer les modifications"}
      </button>
    </form>
    </>
  );
}
