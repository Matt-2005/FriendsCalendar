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
  startDate: Date;
  endDate: Date;
  type: "AVAILABLE" | "VACATION" | "BUSY";
  note: string | null;
  user: User;
}

interface CalendarProps {
  events: Event[];
  availabilities: Availability[];
}

export default function Calendar({ events, availabilities }: CalendarProps) {
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
        title={
          dayAvailabilities.length > 0
            ? `${availableCount} disponible(s), ${vacationCount} en vacances, ${busyCount} occupé(s)`
            : ""
        }
      >
        <span className={styles.dayNumber}>{day}</span>
        
        {dayAvailabilities.length > 0 && (
          <div className={styles.availabilityIndicators}>
            {availableCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#4caf50" }}>
                {availableCount}
              </span>
            )}
            {vacationCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#ff9800" }}>
                ✈️
              </span>
            )}
            {busyCount > 0 && (
              <span className={styles.availIndicator} style={{ background: "#f44336" }}>
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
          <span className={styles.availIndicator} style={{ background: "#4caf50" }}>
            #
          </span>
          <span>Disponibles</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.availIndicator} style={{ background: "#ff9800" }}>
            ✈️
          </span>
          <span>Vacances</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.availIndicator} style={{ background: "#f44336" }}>
            #
          </span>
          <span>Occupés</span>
        </div>
      </div>
    </div>
  );
}
