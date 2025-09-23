// app/events/new/NewEventForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewEventForm() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");           // type="datetime-local"
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          // convertit "YYYY-MM-DDTHH:mm" en ISO
          date: new Date(date).toISOString(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error ?? "Erreur serveur");
      } else {
        r.push("/events");
      }
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  const invalid =
    !title.trim() ||
    !location.trim() ||
    !description.trim() ||
    !date; // laisse le navigateur valider le format

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <label>
        Titre
        <input value={title} onChange={e=>setTitle(e.target.value)} required />
      </label>

      <label>
        Date & heure
        <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} required />
      </label>

      <label>
        Lieu
        <input value={location} onChange={e=>setLocation(e.target.value)} required />
      </label>

      <label>
        Description
        <textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} required />
      </label>

      <button type="submit" disabled={loading || invalid}>
        {loading ? "…" : "Créer l’évènement"}
      </button>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </form>
  );
}
