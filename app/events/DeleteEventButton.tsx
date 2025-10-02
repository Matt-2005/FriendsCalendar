"use client";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function DeleteEventButton({ eventId }: { eventId: number }) {
  const r = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Supprimer cet évènement ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Erreur serveur");
      } else {
        r.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className={styles.evDeleteBtn} /* classe stylée plus bas dans le CSS module */
      onClick={onDelete}
      disabled={loading}
      aria-label="Supprimer l’évènement"
      title="Supprimer"
    >
      {loading ? "…" : "✕"}
    </button>
  );
}
