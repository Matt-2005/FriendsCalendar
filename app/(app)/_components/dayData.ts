import { dayKey } from "@/lib/dates";
import type { AvailabilityVM, EventVM, UserVM } from "@/lib/queries";

export type AvailType = AvailabilityVM["type"];

export type DayInfo = {
  events: EventVM[];
  byUser: Map<number, AvailabilityVM>; // statut de chaque membre ce jour-là
};

const span = (a: AvailabilityVM) => new Date(a.end).getTime() - new Date(a.start).getTime();

/** Regroupe événements et dispos par jour (heure de Paris) */
export function indexByDay(keys: string[], events: EventVM[], availabilities: AvailabilityVM[]) {
  const map = new Map<string, DayInfo>();
  for (const k of keys) map.set(k, { events: [], byUser: new Map() });

  for (const e of events) {
    const s = dayKey(e.start);
    const last = e.end ? dayKey(e.end) : s;
    for (const k of keys) if (k >= s && k <= last) map.get(k)!.events.push(e);
  }
  for (const a of availabilities) {
    const s = dayKey(a.start);
    const last = dayKey(a.end);
    for (const k of keys) {
      if (k < s || k > last) continue;
      const info = map.get(k)!;
      const prev = info.byUser.get(a.userId);
      // En cas de chevauchement, la période la plus courte (la plus précise) l'emporte
      if (!prev || span(a) < span(prev)) info.byUser.set(a.userId, a);
    }
  }
  return map;
}

export function splitMembers(info: DayInfo | undefined, members: UserVM[]) {
  const groups: Record<AvailType | "UNKNOWN", UserVM[]> = { AVAILABLE: [], BUSY: [], VACATION: [], UNKNOWN: [] };
  for (const m of members) {
    const a = info?.byUser.get(m.id);
    groups[a ? a.type : "UNKNOWN"].push(m);
  }
  return groups;
}

export const AVAIL_META: Record<AvailType, { label: string; emoji: string; badge: string }> = {
  AVAILABLE: { label: "Dispo", emoji: "✅", badge: "badge-yes" },
  BUSY: { label: "Pas dispo", emoji: "⛔", badge: "badge-no" },
  VACATION: { label: "En vacances", emoji: "🌴", badge: "badge-vacation" },
};
