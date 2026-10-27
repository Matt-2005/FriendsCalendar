"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "./Toast";

export type RsvpStatus = "YES" | "MAYBE" | "NO";

const OPTIONS: { kind: RsvpStatus; emoji: string; label: string; toast: string }[] = [
  { kind: "YES", emoji: "👍", label: "J'y vais", toast: "Super, c'est noté ! 🎉" },
  { kind: "MAYBE", emoji: "🤔", label: "Peut-être", toast: "Noté, tiens-nous au courant 🤞" },
  { kind: "NO", emoji: "👎", label: "Pas dispo", toast: "Dommage, ce sera pour la prochaine !" },
];

export default function RsvpButtons({
  eventId,
  status,
  compact = false,
}: {
  eventId: number;
  status: RsvpStatus | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<RsvpStatus | null>(status);
  const [, startTransition] = useTransition();
  const showToast = useToast();

  useEffect(() => setCurrent(status), [status]);

  async function choose(kind: RsvpStatus) {
    if (kind === current) return;
    const previous = current;
    setCurrent(kind); // affichage immédiat, sans attendre le serveur
    if ("vibrate" in navigator) navigator.vibrate?.(10);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: kind }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error);
      showToast(OPTIONS.find((o) => o.kind === kind)!.toast);
      startTransition(() => router.refresh());
    } catch (e: any) {
      setCurrent(previous);
      showToast(e?.message || "Pas de connexion, réessaie");
    }
  }

  return (
    <div className={`rsvp ${compact ? "rsvp-compact" : ""}`} role="group" aria-label="Ta réponse">
        {OPTIONS.map((o) => (
          <button
            key={o.kind}
            type="button"
            className="rsvp-btn"
            data-kind={o.kind}
            aria-pressed={current === o.kind}
            onClick={() => choose(o.kind)}
          >
            <span className="rsvp-emoji" aria-hidden>
              {o.emoji}
            </span>
            {o.label}
          </button>
        ))}
    </div>
  );
}
