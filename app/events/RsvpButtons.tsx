"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function RsvpButtons({ eventId }: { eventId: number }) {
  const r = useRouter();
  const [loading, setLoading] = useState<"YES" | "NO" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send(status: "YES" | "NO") {
    setErr(null);
    setLoading(status);
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
        r.refresh();
      }
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => send("YES")}
          disabled={loading !== null}
          className={styles.btnJeParticipe}
        >
          {loading === "YES" ? (
            <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>
              ...
            </span>
          ) : (
            <>✓ Je participe</>
          )}
        </button>
        <button
          onClick={() => send("NO")}
          disabled={loading !== null}
          className={styles.btnJeParticipePas}
        >
          {loading === "NO" ? (
            <span style={{ display: "inline-block", animation: "pulse 1s infinite" }}>
              ...
            </span>
          ) : (
            <>✕ Je ne participe pas</>
          )}
        </button>
      </div>
      {err && (
        <div
          style={{
            color: "#d32f2f",
            fontSize: "0.85rem",
            background: "#ffebee",
            padding: "8px 12px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
