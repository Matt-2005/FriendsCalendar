"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./editevent.module.css";

interface EditEventButtonProps {
  event: {
    id: number;
    title: string;
    description: string;
    location: string;
    date: Date;
    endDate: Date | null;
  };
}

export default function EditEventButton({ event }: EditEventButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.location);
  const [date, setDate] = useState(
    new Date(event.date).toISOString().split("T")[0]
  );
  const [time, setTime] = useState(
    new Date(event.date).toISOString().split("T")[1].substring(0, 5)
  );
  
  // Initialiser endDate et endTime avec une valeur par défaut si null
  const [endDate, setEndDate] = useState(
    event.endDate 
      ? new Date(event.endDate).toISOString().split("T")[0] 
      : new Date(event.date).toISOString().split("T")[0]
  );
  const [endTime, setEndTime] = useState(
    event.endDate
      ? new Date(event.endDate).toISOString().split("T")[1].substring(0, 5)
      : (() => {
          const d = new Date(event.date);
          d.setHours(d.getHours() + 2); // +2 heures par défaut
          return d.toISOString().split("T")[1].substring(0, 5);
        })()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const dateTime = new Date(`${date}T${time}`);
    
    // Vérifier que endDate et endTime sont définis
    if (!endDate || !endTime) {
      setError("Veuillez renseigner la date et l'heure de fin");
      setLoading(false);
      return;
    }

    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (endDateTime <= dateTime) {
      setError("La date de fin doit être après la date de début");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          date: dateTime.toISOString(),
          endDate: endDateTime.toISOString(),
        }),
      });

      if (res.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la modification");
      }
    } catch (err) {
      setError("Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className={styles.editButton}>
        ✏️
      </button>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Modifier l'événement</h3>
              <button onClick={() => setShowModal(false)} className={styles.modalClose}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.formGroup}>
                <label>Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Lieu *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date et heure de début *</label>
                <div className={styles.dateTimeRow}>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      // Mettre à jour la date de fin si elle devient invalide
                      if (endDate && new Date(e.target.value) > new Date(endDate)) {
                        setEndDate(e.target.value);
                      }
                    }}
                    required
                    className={styles.input}
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    step="300"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Date et heure de fin *</label>
                <div className={styles.dateTimeRow}>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={date}
                    required
                    className={styles.input}
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    step="300"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? "Modification..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
