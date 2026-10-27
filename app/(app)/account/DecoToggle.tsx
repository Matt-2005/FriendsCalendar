"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Interrupteur pour couper les décorations de saison sur cet appareil */
export default function DecoToggle({ enabled, label, emoji }: { enabled: boolean; label: string; emoji: string }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);

  function toggle() {
    const next = !on;
    setOn(next);
    document.cookie = next ? "deco=; path=/; max-age=0" : "deco=off; path=/; max-age=31536000; samesite=lax";
    router.refresh();
  }

  return (
    <button type="button" className="card list-item" style={{ borderRadius: "var(--radius-lg)" }} onClick={toggle} role="switch" aria-checked={on}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span className="grow">
        Décorations {label}
        <span className="small muted" style={{ display: "block" }}>
          {on ? "Activées sur ce téléphone" : "Désactivées sur ce téléphone"}
        </span>
      </span>
      <span className={`switch ${on ? "is-on" : ""}`} aria-hidden />
    </button>
  );
}
