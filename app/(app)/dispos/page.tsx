import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { getAvailabilities, getEventsBetween, getMembers } from "@/lib/queries";
import { addDaysToKey, currentMonth, dayKey, monthGrid, parisDayEnd, parisDayStart, todayKey } from "@/lib/dates";
import { indexByDay } from "../_components/dayData";
import DisposView, { type BestDay } from "./DisposView";

export const metadata: Metadata = { title: "Mes dispos" };

export default async function DisposPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const me = await requireMe();
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : currentMonth();
  const keys = monthGrid(month).filter(Boolean) as string[];

  // Les 45 prochains jours, pour trouver les meilleures dates
  const today = todayKey();
  const horizon = Array.from({ length: 45 }, (_, i) => addDaysToKey(today, i));
  const from = parisDayStart(keys[0] < today ? keys[0] : today);
  const to = parisDayEnd(keys[keys.length - 1] > horizon[44] ? keys[keys.length - 1] : horizon[44]);

  const [availabilities, members, events] = await Promise.all([
    getAvailabilities(from, to),
    getMembers(),
    getEventsBetween(me, parisDayStart(today), parisDayEnd(horizon[44])),
  ]);

  // Mon statut jour par jour sur le mois affiché
  const monthIndex = indexByDay(keys, [], availabilities.filter((a) => a.userId === me.id));
  const mine: Record<string, string> = {};
  for (const [k, info] of monthIndex) {
    const a = info.byUser.get(me.id);
    if (a) mine[k] = a.type;
  }

  // Meilleurs jours : le plus de potes dispo, sans personne qui a bloqué la date
  const index = indexByDay(horizon, events, availabilities);
  const best: BestDay[] = horizon
    .map((k) => {
      const info = index.get(k)!;
      const free = members.filter((u) => info.byUser.get(u.id)?.type === "AVAILABLE");
      const busy = members.filter((u) => ["BUSY", "VACATION"].includes(info.byUser.get(u.id)?.type ?? "")).length;
      return { key: k, free, busy, events: info.events.map((e) => ({ id: e.id, title: e.title, emoji: e.emoji })) };
    })
    .filter((d) => d.free.length >= 2)
    .sort((a, b) => b.free.length - a.free.length || a.busy - b.busy || a.key.localeCompare(b.key))
    .slice(0, 5)
    .sort((a, b) => a.key.localeCompare(b.key));

  // Mes périodes à venir (pour les retrouver et les supprimer)
  const periods = availabilities
    .filter((a) => a.userId === me.id && dayKey(a.end) >= today && dayKey(a.start) !== dayKey(a.end))
    .map((a) => ({ id: a.id, type: a.type, start: a.start, end: a.end, note: a.note }));

  return (
    <DisposView
      key={month}
      month={month}
      mine={mine}
      best={best}
      periods={periods}
      membersCount={members.length}
    />
  );
}
