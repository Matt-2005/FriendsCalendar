import "server-only";
import ical, { ICalAlarmType, ICalCalendarMethod, ICalEventStatus, type ICalCalendar } from "ical-generator";
import { eventEmoji } from "./eventEmoji";

type IcsEvent = {
  id: number;
  title: string;
  description: string;
  location: string;
  date: Date;
  endDate: Date | null;
  updatedAt: Date;
  creator?: { pseudo: string } | null;
};

export type MyStatus = "YES" | "NO" | "MAYBE" | null;

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

export function newCalendar(name = "Les Indécis") {
  return ical({
    name,
    description: `Les sorties du groupe ${name} — Les Indécis Agenda`,
    prodId: { company: "lesindecis", product: "agenda", language: "FR" },
    // Pas de fuseau "flottant" : heures écrites en UTC (suffixe Z), les agendas convertissent tout seuls
    method: ICalCalendarMethod.PUBLISH,
    ttl: 60 * 15,
  });
}

/**
 * Ajoute un événement au calendrier.
 * - "J'y vais" : événement confirmé + rappels la veille et 2 h avant
 * - "Peut-être" : événement provisoire, préfixé 🤔
 * - Sans réponse : préfixé ❓ pour inviter à répondre
 */
export function addEvent(cal: ICalCalendar, e: IcsEvent, status: MyStatus, baseUrl: string, groupName?: string) {
  const url = `${baseUrl}/events/${e.id}`;
  const prefix = status === "MAYBE" ? "🤔 " : status === null ? "❓ " : "";
  const footer =
    status === null
      ? `Tu n'as pas encore répondu 👉 ${url}`
      : `Voir qui vient / changer ma réponse 👉 ${url}`;

  const ev = cal.createEvent({
    id: `event-${e.id}@lesindecis.fr`,
    start: e.date,
    end: e.endDate ?? new Date(e.date.getTime() + DEFAULT_DURATION_MS),
    summary: `${prefix}${eventEmoji(e.title)} ${e.title}`,
    description: [
      e.description,
      [e.creator ? `Organisé par ${e.creator.pseudo}` : "", groupName ? `Groupe : ${groupName}` : ""].filter(Boolean).join(" · "),
      footer,
    ]
      .filter(Boolean)
      .join("\n\n"),
    location: e.location || undefined,
    url,
    status: status === "YES" ? ICalEventStatus.CONFIRMED : ICalEventStatus.TENTATIVE,
    lastModified: e.updatedAt,
    stamp: e.updatedAt,
    // Change à chaque modification pour que les agendas prennent la mise à jour
    sequence: Math.floor(e.updatedAt.getTime() / 1000),
  });

  if (status === "YES") {
    ev.createAlarm({ type: ICalAlarmType.display, trigger: 24 * 3600, description: e.title });
    ev.createAlarm({ type: ICalAlarmType.display, trigger: 2 * 3600, description: e.title });
  }
  return ev;
}

export function icsResponse(cal: ICalCalendar, filename: string, inline = true) {
  return new Response(cal.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    },
  });
}
