"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function RsvpButtons({ eventId }: { eventId: number }) {
  const r = useRouter();
  const [loading, setLoading] = useState<"YES" | "NO" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send(status: "YES" | "NO") {
    setErr(null); setLoading(status);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Erreur serveur");
      } else {
        r.refresh(); // ♻️ recharge la page serveur pour voir la nouvelle liste
      }
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8,  alignItems: "center", justifyContent: "center" }}>
      <button onClick={() => send("YES")} disabled={loading !== null} className={styles.btnJeParticipe}>
        {loading === "YES" ? "…" : "Je participe"}
      </button>
      <button onClick={() => send("NO")} disabled={loading !== null} className={styles.btnJeParticipePas}>
        {loading === "NO" ? "…" : "Je ne participe pas"}
      </button>
      {err && <span style={{ color: "crimson", fontSize: 12 }}>{err}</span>}
    </div>
  );
}
