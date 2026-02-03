// app/events/Calendar.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Event {
  id: number;
  title: string;
  date: Date;
  endDate: Date | null;
  location: string | null;
  description: string | null;
  rsvps: {
    status: "YES" | "NO";
    userID: number;
  }[];
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availabilityToDelete, setAvailabilityToDelete] = useState<number | null>(null);

  // Helper pour convertir une Date en format "YYYY-MM-DD" local (sans conversion UTC)
  const toLocalDateString = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper pour créer une Date à partir d'une chaîne "YYYY-MM-DD" en local (minuit local)
  const fromLocalDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (showAvailabilityModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showAvailabilityModal]);

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // Ajuster pour que lundi soit le premier jour (0) au lieu de dimanche
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

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

  // Vérifier si un jour fait partie d'un événement (début, fin ou entre les deux)
  const isEventOnDay = (event: Event, day: number) => {
    const currentDayDate = new Date(year, month, day);
    currentDayDate.setHours(0, 0, 0, 0);
    
    const eventStart = new Date(event.date);
    eventStart.setHours(0, 0, 0, 0);
    
    const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.date);
    eventEnd.setHours(23, 59, 59, 999);
    
    return currentDayDate >= eventStart && currentDayDate <= eventEnd;
  };

  const hasEvent = (day: number) => {
    return events.some((event) => isEventOnDay(event, day));
  };

  const getEventsForDay = (day: number) => {
    return events.filter((event) => isEventOnDay(event, day));
  };

  // Déterminer le statut RSVP de l'utilisateur courant pour un événement
  const getUserRSVPStatus = (event: Event): "YES" | "NO" | "PENDING" => {
    if (!currentUserId) return "PENDING";
    
    const userRsvp = event.rsvps.find((rsvp) => rsvp.userID === currentUserId);
    return userRsvp ? userRsvp.status : "PENDING";
  };

  // Déterminer la classe CSS selon le statut RSVP
  const getEventColorClass = (event: Event): string => {
    const status = getUserRSVPStatus(event);
    switch (status) {
      case "YES":
        return styles.eventGreen;
      case "NO":
        return styles.eventRed;
      case "PENDING":
        return styles.eventOrange;
      default:
        return styles.eventOrange;
    }
  };

  const getAvailabilitiesForDay = (day: number) => {
    // Créer une date normalisée pour le jour courant (minuit local)
    const currentDayDate = new Date(year, month, day);
    currentDayDate.setHours(0, 0, 0, 0);
    const currentDayTimestamp = currentDayDate.getTime();
    
    return availabilities.filter((avail) => {
      // Extraire les dates sans se soucier des heures/timezone
      const startDate = new Date(avail.startDate);
      const startNormalized = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const startTimestamp = startNormalized.getTime();
      
      const endDate = new Date(avail.endDate);
      const endNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const endTimestamp = endNormalized.getTime();
      
      // Vérifier si le jour courant est entre le début et la fin (inclus)
      return currentDayTimestamp >= startTimestamp && currentDayTimestamp <= endTimestamp;
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

  const getSelectedDayEvents = () => {
    if (!selectedDate) return [];
    return getEventsForDay(selectedDate.getDate());
  };

  const getSelectedDayAvailabilities = () => {
    if (!selectedDate) return [];
    return getAvailabilitiesForDay(selectedDate.getDate());
  };

  const handleCreateAvailability = async () => {
    if (!selectedDate || !endDate || !currentUserId) return;

    setIsSubmitting(true);
    try {
      // Normaliser les dates : début à minuit, fin à 23:59:59
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(0, 0, 0, 0);
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      const res = await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
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

  const handleDeleteClick = (id: number) => {
    setAvailabilityToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!availabilityToDelete) return;

    try {
      const res = await fetch(`/api/availabilities/${availabilityToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        setAvailabilityToDelete(null);
        window.location.reload();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAvailabilityToDelete(null);
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
                className={`${styles.eventDot} ${getEventColorClass(event)}`}
                title={event.title}
              />
            ))}
            {dayEvents.length > 3 && (
              <div className={styles.eventMore} title={`+${dayEvents.length - 3} événements`}>
                +{dayEvents.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.calendarContainer}>
      {/* Légende des couleurs */}
      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.eventGreen}`}></div>
          <span>J'ai accepté</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.eventOrange}`}></div>
          <span>Pas encore répondu</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.eventRed}`}></div>
          <span>J'ai refusé</span>
        </div>
      </div>

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
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
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
                    handleDeleteClick(avail.id);
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

      {/* Modal pour voir les événements et créer une disponibilité */}
      {showAvailabilityModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAvailabilityModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {selectedDate?.toLocaleDateString("fr-FR", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long" 
                })}
              </h3>
              <button onClick={() => setShowAvailabilityModal(false)} className={styles.modalClose}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Section des événements */}
              {getSelectedDayEvents().length > 0 && (
                <div className={styles.modalEventsSection}>
                  <h4 className={styles.modalSectionTitle}>📅 Événements du jour</h4>
                  {getSelectedDayEvents().map((event) => {
                    const status = getUserRSVPStatus(event);
                    return (
                      <div key={event.id} className={styles.modalEventCard}>
                        <div className={styles.modalEventHeader}>
                          <span className={`${styles.modalEventStatus} ${
                            status === "YES" ? styles.statusYes : 
                            status === "NO" ? styles.statusNo : 
                            styles.statusPending
                          }`}>
                            {status === "YES" ? "✓" : status === "NO" ? "✗" : "?"}
                          </span>
                          <h5 className={styles.modalEventTitle}>{event.title}</h5>
                        </div>
                        {event.description && (
                          <p className={styles.modalEventDesc}>{event.description}</p>
                        )}
                        <div className={styles.modalEventMeta}>
                          {event.location && <span>📍 {event.location}</span>}
                          <span>
                            🕐 {new Date(event.date).toLocaleTimeString("fr-FR", { 
                              hour: "2-digit", 
                              minute: "2-digit" 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Section des disponibilités du jour */}
              {getSelectedDayAvailabilities().length > 0 && (
                <div className={styles.modalAvailabilitiesSection}>
                  <h4 className={styles.modalSectionTitle}>👥 Disponibilités</h4>
                  {getSelectedDayAvailabilities().map((avail) => (
                    <div key={avail.id} className={styles.modalAvailabilityItem}>
                      <div className={styles.modalAvailUser}>
                        {avail.user.avatarUrl ? (
                          <img src={avail.user.avatarUrl} alt={avail.user.pseudo} className={styles.modalAvailAvatar} />
                        ) : (
                          <div className={styles.modalAvailAvatarPlaceholder}>
                            {avail.user.pseudo[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <span>{avail.user.pseudo}</span>
                      </div>
                      <div className={styles.modalAvailRight}>
                        <span className={`${styles.modalAvailBadge} ${styles[`type${avail.type}`]}`}>
                          {avail.type === "AVAILABLE" ? "Disponible" : 
                           avail.type === "VACATION" ? "Vacances" : "Occupé"}
                        </span>
                        {avail.userId === currentUserId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(avail.id);
                            }}
                            className={styles.deleteAvailabilityBtnModal}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Séparateur */}
              {(getSelectedDayEvents().length > 0 || getSelectedDayAvailabilities().length > 0) && (
                <div className={styles.modalDivider}></div>
              )}

              {/* Formulaire pour ajouter une disponibilité */}
              <h4 className={styles.modalSectionTitle}>➕ Ajouter une disponibilité</h4>
              
              <div className={styles.formGroup}>
                <label>Date de début</label>
                <input
                  type="date"
                  value={toLocalDateString(selectedDate)}
                  onChange={(e) => setSelectedDate(fromLocalDateString(e.target.value))}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Date de fin</label>
                <input
                  type="date"
                  value={toLocalDateString(endDate)}
                  onChange={(e) => setEndDate(fromLocalDateString(e.target.value))}
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

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Supprimer cette disponibilité ?</h3>
            <p className={styles.confirmText}>Cette action est irréversible.</p>
            <div className={styles.confirmButtons}>
              <button onClick={handleDeleteCancel} className={styles.confirmCancelBtn}>
                Annuler
              </button>
              <button onClick={handleDeleteConfirm} className={styles.confirmDeleteBtn}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
