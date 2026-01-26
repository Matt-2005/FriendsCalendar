// app/events/new/NewEventForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./newevent.module.css";

export default function NewEventForm() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
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
    !title.trim() || !location.trim() || !description.trim() || !date;

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>
          Titre de l'événement
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Soirée cinéma, Barbecue..."
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="date" className={styles.label}>
          Date et heure
        </label>
        <input
          id="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="location" className={styles.label}>
          Lieu
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex: Chez moi, Parc de la ville..."
          className={styles.input}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez votre événement..."
          className={styles.textarea}
          required
        />
      </div>

      {err && (
        <div className={styles.error}>
          <span>⚠️</span>
          {err}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || invalid}
        className={styles.submitButton}
      >
        {loading ? "Création en cours..." : "Créer l'événement"}
      </button>
    </form>
  );
}
