// app/events/new/NewEventForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./newevent.module.css";

export default function NewEventForm() {
  const r = useRouter();
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Raccourcis de date
  const setQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setSelectedEndDate(dateStr); // Même jour par défaut
    
    // Si pas d'heure définie, mettre 19h par défaut pour le début
    if (!selectedTime) {
      setSelectedTime("19:00");
    }
    // Et 21h pour la fin
    if (!selectedEndTime) {
      setSelectedEndTime("21:00");
    }
  };

  const setWeekendDate = () => {
    const date = new Date();
    const day = date.getDay();
    const daysUntilSaturday = day === 0 ? 6 : 6 - day;
    date.setDate(date.getDate() + daysUntilSaturday);
    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(dateStr);
    setSelectedEndDate(dateStr);
    
    if (!selectedTime) {
      setSelectedTime("14:00");
    }
    if (!selectedEndTime) {
      setSelectedEndTime("18:00");
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // Combiner date et heure de début
      const dateTimeString = `${selectedDate}T${selectedTime}`;
      const dateTime = new Date(dateTimeString);

      // Combiner date et heure de fin
      if (!selectedEndDate || !selectedEndTime) {
        setErr("Veuillez renseigner la date et l'heure de fin");
        setLoading(false);
        return;
      }

      const endDateTimeString = `${selectedEndDate}T${selectedEndTime}`;
      const endDateTime = new Date(endDateTimeString);

      // Vérifier que la date de fin est après la date de début
      if (endDateTime <= dateTime) {
        setErr("La date de fin doit être après la date de début");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          date: dateTime.toISOString(),
          endDate: endDateTime.toISOString(),
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
    !selectedDate ||
    !selectedTime ||
    !selectedEndDate ||
    !selectedEndTime;

  // Formater la date sélectionnée pour l'affichage
  const formatSelectedDate = () => {
    if (!selectedDate || !selectedTime) return "";
    const date = new Date(`${selectedDate}T${selectedTime}`);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatSelectedEndDate = () => {
    if (!selectedEndDate || !selectedEndTime) return "";
    const date = new Date(`${selectedEndDate}T${selectedEndTime}`);
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="title" className={styles.label}>
          Titre de l'événement *
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

      <div className={styles.dateTimeSection}>
        <label className={styles.label}>Date et heure de début *</label>

        <div className={styles.quickDates}>
          <button
            type="button"
            onClick={() => setQuickDate(0)}
            className={styles.quickDateBtn}
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => setQuickDate(1)}
            className={styles.quickDateBtn}
          >
            Demain
          </button>
          <button
            type="button"
            onClick={setWeekendDate}
            className={styles.quickDateBtn}
          >
            Ce weekend
          </button>
        </div>

        <div className={styles.dateTimeInputs}>
          <div className={styles.formGroup}>
            <label htmlFor="date" className={styles.subLabel}>
              📅 Date
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                // Mettre à jour la date de fin si vide
                if (!selectedEndDate) {
                  setSelectedEndDate(e.target.value);
                }
              }}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="time" className={styles.subLabel}>
              🕐 Heure
            </label>
            <input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className={styles.input}
              step="300"
              required
            />
          </div>
        </div>

        {selectedDate && selectedTime && (
          <div className={styles.datePreview}>
            <span className={styles.previewIcon}>✓</span>
            <span className={styles.previewText}>{formatSelectedDate()}</span>
          </div>
        )}
      </div>

      <div className={styles.dateTimeSection}>
        <label className={styles.label}>Date et heure de fin *</label>

        <div className={styles.dateTimeInputs}>
          <div className={styles.formGroup}>
            <label htmlFor="endDate" className={styles.subLabel}>
              📅 Date de fin
            </label>
            <input
              id="endDate"
              type="date"
              value={selectedEndDate}
              onChange={(e) => setSelectedEndDate(e.target.value)}
              min={selectedDate}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="endTime" className={styles.subLabel}>
              🕐 Heure de fin
            </label>
            <input
              id="endTime"
              type="time"
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
              className={styles.input}
              step="300"
              required
            />
          </div>
        </div>

        {selectedEndDate && selectedEndTime && (
          <div className={styles.datePreview}>
            <span className={styles.previewIcon}>✓</span>
            <span className={styles.previewText}>{formatSelectedEndDate()}</span>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="location" className={styles.label}>
          Lieu *
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
          Description *
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
        <div className={styles.charCount}>
          {description.length} caractères
        </div>
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
        {loading ? (
          <>
            <span className={styles.spinner}></span>
            Création en cours...
          </>
        ) : (
          <>
            <span>✨</span>
            Créer l'événement
          </>
        )}
      </button>
    </form>
  );
}
