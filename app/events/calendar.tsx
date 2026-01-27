// app/events/Calendar.tsx
"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface Event {
  id: number;
  title: string;
  date: Date;
  location: string | null;
  description: string | null;
}

interface User {
  id: number;
  pseudo: string;
  avatarUrl: string | null;
}

interface Availability {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  type: "AVAILABLE" | "VACATION" | "BUSY";
  note: string | null;
  user: User;
}

interface CalendarProps {
  events: Event[];
  availabilities: Availability[];
  currentUserId: number | null;
}

export default function Calendar({ events, availabilities, currentUserId }: CalendarProps) {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availabilityType, setAvailabilityType] = useState<"AVAILABLE" | "VACATION" | "BUSY">("AVAILABLE");
  const [availabilityNote, setAvailabilityNote] = useState("");
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const hasEvent = (day: number) => {
    return events.some((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  };

  const getAvailabilitiesForDay = (day: number) => {
    const currentDayDate = new Date(year, month, day);
    return availabilities.filter((avail) => {
      const start = new Date(avail.startDate);
      const end = new Date(avail.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      currentDayDate.setHours(12, 0, 0, 0);
      return currentDayDate >= start && currentDayDate <= end;
    });
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    setSelectedDate(clickedDate);
    setEndDate(clickedDate);
    setAvailabilityType("AVAILABLE");
    setAvailabilityNote("");
    setShowAvailabilityModal(true);
  };

  const handleCreateAvailability = async () => {
    if (!selectedDate || !endDate || !currentUserId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selectedDate.toISOString(),
          endDate: endDate.toISOString(),
          type: availabilityType,
          note: availabilityNote || null,
        }),
      });

      if (res.ok) {
        setShowAvailabilityModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Error creating availability:", error);
      alert("Erreur lors de la création de la disponibilité");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvailability = async (id: number) => {
    if (!confirm("Supprimer cette disponibilité ?")) return;

    try {
      const res = await fetch(`/api/availabilities/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        window.location.reload();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className={styles.calendarDay}></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const dayAvailabilities = getAvailabilitiesForDay(day);
    
    const availableCount = dayAvailabilities.filter(a => a.type === "AVAILABLE").length;
    const vacationCount = dayAvailabilities.filter(a => a.type === "VACATION").length;
    const busyCount = dayAvailabilities.filter(a => a.type === "BUSY").length;
    
    days.push(
      <div
        key={day}
        className={`${styles.calendarDay} ${
          isToday(day) ? styles.today : ""
        } ${hasEvent(day) ? styles.hasEvent : ""} ${
          dayAvailabilities.length > 0 ? styles.hasAvailabilities : ""
        }`}
        onClick={() => handleDayClick(day)}
        style={{ cursor: "pointer" }}
      >
        <span className={styles.dayNumber}>{day}</span>
        
        {dayAvailabilities.length > 0 && (
          <div className={styles.availabilityIndicators}>
            {availableCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#4caf50" }} title={`${availableCount} disponible(s)`}>
                {availableCount}
              </span>
            )}
            {vacationCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#ff9800" }} title={`${vacationCount} en vacances`}>
                ✈️
              </span>
            )}
            {busyCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#f44336" }} title={`${busyCount} occupé(s)`}>
                {busyCount}
              </span>
            )}
          </div>
        )}
        
        {dayEvents.length > 0 && (
          <div className={styles.eventDots}>
            {dayEvents.slice(0, 3).map((event, idx) => (
              <div
                key={idx}
                className={styles.eventDot}
                title={event.title}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <button onClick={prevMonth} className={styles.calendarNavBtn}>
          ‹
        </button>
        <h2 className={styles.calendarTitle}>
          {monthNames[month]} {year}
        </h2>
        <button onClick={nextMonth} className={styles.calendarNavBtn}>
          ›
        </button>
      </div>

      <div className={styles.calendarWeekdays}>
        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>{days}</div>

      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot}></div>
          <span>Événement</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendToday}></div>
          <span>Aujourd'hui</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.availIndicator} style={{ background: "#4caf50" }}>#</span>
          <span>Disponibles</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.availIndicator} style={{ background: "#ff9800" }}>✈️</span>
          <span>Vacances</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.availIndicator} style={{ background: "#f44336" }}>#</span>
          <span>Occupés</span>
        </div>
      </div>

      {/* Liste des disponibilités en dessous du calendrier */}
      {availabilities.length > 0 && (
        <div className={styles.availabilityList}>
          <h3 className={styles.availabilityListTitle}>Disponibilités</h3>
          {availabilities.map((avail) => (
            <div key={avail.id} className={styles.availabilityItem}>
              <div className={styles.availabilityUser}>
                {avail.user.avatarUrl ? (
                  <img src={avail.user.avatarUrl} alt={avail.user.pseudo} className={styles.availabilityAvatar} />
                ) : (
                  <div className={styles.availabilityAvatarPlaceholder}>
                    {avail.user.pseudo[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className={styles.availabilityUserName}>{avail.user.pseudo}</span>
              </div>
              <div className={styles.availabilityDetails}>
                <span className={`${styles.availabilityBadge} ${styles[`type${avail.type}`]}`}>
                  {avail.type === "AVAILABLE" ? "Disponible" : avail.type === "VACATION" ? "Vacances" : "Occupé"}
                </span>
                <span className={styles.availabilityDates}>
                  {new Date(avail.startDate).toLocaleDateString("fr-FR")} - {new Date(avail.endDate).toLocaleDateString("fr-FR")}
                </span>
                {avail.note && <span className={styles.availabilityNote}>{avail.note}</span>}
              </div>
              {avail.userId === currentUserId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAvailability(avail.id);
                  }}
                  className={styles.deleteAvailabilityBtn}
                  title="Supprimer"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal pour créer une disponibilité */}
      {showAvailabilityModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAvailabilityModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Ajouter une disponibilité</h3>
              <button onClick={() => setShowAvailabilityModal(false)} className={styles.modalClose}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Date de début</label>
                <input
                  type="date"
                  value={selectedDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date de fin</label>
                <input
                  type="date"
                  value={endDate?.toISOString().split("T")[0] || ""}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Type de disponibilité</label>
                <select
                  value={availabilityType}
                  onChange={(e) => setAvailabilityType(e.target.value as any)}
                  className={styles.modalSelect}
                >
                  <option value="AVAILABLE">Disponible</option>
                  <option value="VACATION">Vacances</option>
                  <option value="BUSY">Occupé</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Note (optionnel)</label>
                <input
                  type="text"
                  value={availabilityNote}
                  onChange={(e) => setAvailabilityNote(e.target.value)}
                  placeholder="Ex: Vacances à la plage"
                  className={styles.modalInput}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowAvailabilityModal(false)} className={styles.modalBtnCancel}>
                Annuler
              </button>
              <button
                onClick={handleCreateAvailability}
                disabled={isSubmitting}
                className={styles.modalBtnSubmit}
              >
                {isSubmitting ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
