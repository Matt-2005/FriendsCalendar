"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/Toast";
import { AVAIL_META, type AvailType } from "./dayData";

/** Les 3 gros boutons "Moi ce jour-là" */
export default function MyDayStatus({ day, status }: { day: string; status: AvailType | null }) {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState(status);
  useEffect(() => setCurrent(status), [status, day]);

  async function choose(type: AvailType) {
    const next = current === type ? null : type;
    const prev = current;
    setCurrent(next);
    const res = await fetch("/api/availabilities/day", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: [day], type: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setCurrent(prev);
      toast("Pas de connexion, réessaie");
      return;
    }
    toast(next ? `${AVAIL_META[next].emoji} C'est noté` : "Statut effacé");
    router.refresh();
  }

  return (
    <div className="avail-pick" role="group" aria-label="Mon statut ce jour-là">
      {(Object.keys(AVAIL_META) as AvailType[]).map((t) => (
        <button key={t} type="button" className="avail-btn" data-kind={t} aria-pressed={current === t} onClick={() => choose(t)}>
          <span aria-hidden>{AVAIL_META[t].emoji}</span>
          {AVAIL_META[t].label}
        </button>
      ))}
    </div>
  );
}
