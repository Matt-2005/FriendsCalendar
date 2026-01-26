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

interface CalendarProps {
  events: Event[];
}

export default function Calendar({ events }: CalendarProps) {
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

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className={styles.calendarDay}></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    days.push(
      <div
        key={day}
        className={`${styles.calendarDay} ${
          isToday(day) ? styles.today : ""
        } ${hasEvent(day) ? styles.hasEvent : ""}`}
      >
        <span className={styles.dayNumber}>{day}</span>
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
      </div>
    </div>
  );
}
