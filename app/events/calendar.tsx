// app/events/Calendar.tsx
"use client";

import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import frLocale from "@fullcalendar/core/locales/fr";

import styles from "./page.module.css";


const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });

export default function Calendar() {
    return (
        <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek" }}
        locales={[frLocale]}
        locale="fr"
        height="100%"
        navLinks
        nowIndicator
        dayMaxEvents
        events="/api/events"
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        
        />
    );
}
