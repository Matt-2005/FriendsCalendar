"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./availabilities.module.css";

type Availability = {
  id: number;
  startDate: Date;
  endDate: Date;
  type: "AVAILABLE" | "VACATION" | "BUSY";
  note: string | null;
};

export default function AvailabilityManager({
  initialAvailabilities,
  userId,
}: {
  initialAvailabilities: Availability[];
  userId: number;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "AVAILABLE" as "AVAILABLE" | "VACATION" | "BUSY",
    note: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      setShowForm(false);
      setFormData({ startDate: "", endDate: "", type: "AVAILABLE", note: "" });
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette disponibilité ?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.manager}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
        >
          + Ajouter une disponibilité
        </button>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h3 className={styles.formTitle}>Nouvelle disponibilité</h3>
          
          {error && (
            <div className={styles.errorMessage}>❌ {error}</div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Date de début</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                min={today}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Date de fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={formData.startDate || today}
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as any,
                })
              }
              className={styles.select}
            >
              <option value="AVAILABLE">✅ Disponible</option>
              <option value="VACATION">🏖️ Vacances</option>
              <option value="BUSY">🚫 Occupé</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Note (optionnel)</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              placeholder="Ex: Disponible pour sortir"
              className={styles.input}
              maxLength={100}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
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
              {loading ? "⏳ Enregistrement..." : "✓ Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div className={styles.myAvailabilities}>
        {initialAvailabilities.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>📅</p>
            <p className={styles.emptyText}>
              Vous n'avez pas encore ajouté de disponibilité
            </p>
          </div>
        ) : (
          <div className={styles.availabilitiesList}>
            {initialAvailabilities.map((avail) => (
              <div key={avail.id} className={styles.myAvailabilityCard}>
                <div className={styles.availabilityHeader}>
                  <div className={`${styles.typeBadge} ${styles[`type${avail.type}`]}`}>
                    {avail.type === "AVAILABLE" && "✅ Disponible"}
                    {avail.type === "VACATION" && "🏖️ Vacances"}
                    {avail.type === "BUSY" && "🚫 Occupé"}
                  </div>
                  <button
                    onClick={() => handleDelete(avail.id)}
                    className={styles.deleteButton}
                    disabled={loading}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>

                <div className={styles.dates}>
                  Du {new Date(avail.startDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  au {new Date(avail.endDate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>

                {avail.note && (
                  <p className={styles.note}>💬 {avail.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
