import type { Metadata } from "next";
import { requireGroup } from "@/lib/session";
import { getAvailabilities, getEventsBetween, getMembers } from "@/lib/queries";
import { currentMonth, monthGrid, parisDayEnd, parisDayStart } from "@/lib/dates";
import CalendarView from "./CalendarView";

export const metadata: Metadata = { title: "Calendrier" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  const { me, group } = await requireGroup();
  const { m, d } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : currentMonth();

  const keys = monthGrid(month).filter(Boolean) as string[];
  const from = parisDayStart(keys[0]);
  const to = parisDayEnd(keys[keys.length - 1]);

  const [events, availabilities, members] = await Promise.all([
    getEventsBetween(me, group.id, from, to),
    getAvailabilities(group.id, from, to),
    getMembers(group.id),
  ]);

  return (
    <CalendarView
      month={month}
      events={events}
      availabilities={availabilities}
      members={members}
      meId={me.id}
      initialDay={d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null}
    />
  );
}
