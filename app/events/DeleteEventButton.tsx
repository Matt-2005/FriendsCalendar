"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function DeleteEventButton({ eventId }: { eventId: number }) {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        r.push("/events");
        r.refresh();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className={styles.evDeleteBtn}
        title="Supprimer l'événement"
      >
        🗑️
      </button>

      {showConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Supprimer cet événement ?</h3>
            <p className={styles.confirmText}>Cette action est irréversible.</p>
            <div className={styles.confirmButtons}>
              <button 
                onClick={() => setShowConfirm(false)} 
                className={styles.confirmCancelBtn}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                onClick={handleDelete} 
                className={styles.confirmDeleteBtn}
                disabled={loading}
              >
                {loading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
