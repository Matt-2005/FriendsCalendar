"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmDialog from "../../../components/ConfirmDialog";
import { useToast } from "../../../components/Toast";

export function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const toast = useToast();
  async function share() {
    const full = `${text}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* partage annulé */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(full);
      toast("Lien copié, colle-le dans le groupe 📋");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, "_blank");
    }
  }
  return (
    <button type="button" className="btn btn-outline btn-block" onClick={share}>
      📤 Partager
    </button>
  );
}

export function RemindButton({ eventId, pendingCount }: { eventId: number; pendingCount: number }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  if (pendingCount === 0) return null;
  async function remind() {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/remind`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setDone(true);
      toast(`Relance envoyée à ${j.count} personne${j.count > 1 ? "s" : ""} 📣`);
    } else toast(j.error ?? "Échec de la relance");
  }
  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={remind} disabled={busy || done}>
      {done ? "Relancé ✓" : "📣 Relancer"}
    </button>
  );
}

export function ManageButtons({ eventId, title }: { eventId: number; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Sortie supprimée");
      router.replace("/events");
      router.refresh();
    } else {
      setBusy(false);
      setConfirm(false);
      toast((await res.json().catch(() => ({}))).error ?? "Impossible de supprimer");
    }
  }

  return (
    <>
      <div className="grid-2">
        <Link href={`/events/${eventId}/edit`} className="btn btn-outline">
          ✏️ Modifier
        </Link>
        <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>
          🗑️ Supprimer
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        title={`Annuler « ${title} » ?`}
        text="La sortie sera supprimée et les participants seront prévenus."
        confirmLabel="Supprimer"
        danger
        loading={busy}
        onConfirm={remove}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
