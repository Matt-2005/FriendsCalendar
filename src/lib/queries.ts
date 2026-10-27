import { cache } from "react";
import { prisma } from "./prisma";
import { eventEmoji } from "./eventEmoji";
import type { Me } from "./session";

export type UserVM = { id: number; pseudo: string; avatarUrl: string | null };
export type Status = "YES" | "MAYBE" | "NO";

export type EventVM = {
  id: number;
  title: string;
  emoji: string;
  description: string;
  location: string;
  start: string;
  end: string | null;
  creator: UserVM;
  yes: UserVM[];
  maybe: UserVM[];
  no: UserVM[];
  myStatus: Status | null;
  canManage: boolean;
};

const userSelect = { id: true, pseudo: true, avatarUrl: true } as const;

/** Un événement est "en cours ou à venir" tant qu'il n'est pas terminé */
export function upcomingWhere(now = new Date()) {
  return {
    OR: [
      { endDate: { gte: now } },
      { endDate: null, date: { gte: new Date(now.getTime() - 3 * 3600e3) } },
    ],
  };
}

type Row = Awaited<ReturnType<typeof fetchRows>>[number];

function fetchRows(where: object, order: "asc" | "desc" = "asc", take = 200) {
  return prisma.event.findMany({
    where,
    orderBy: { date: order },
    take,
    include: {
      creator: { select: userSelect },
      rsvps: { select: { status: true, userID: true, user: { select: userSelect } }, orderBy: { updatedAt: "asc" } },
    },
  });
}

function toVM(e: Row, me: Me): EventVM {
  const by = (s: Status) => e.rsvps.filter((r) => r.status === s).map((r) => r.user);
  return {
    id: e.id,
    title: e.title,
    emoji: eventEmoji(e.title),
    description: e.description,
    location: e.location,
    start: e.date.toISOString(),
    end: e.endDate?.toISOString() ?? null,
    creator: e.creator,
    yes: by("YES"),
    maybe: by("MAYBE"),
    no: by("NO"),
    myStatus: (e.rsvps.find((r) => r.userID === me.id)?.status as Status) ?? null,
    canManage: me.id === e.creatorId || me.role === "ADMIN",
  };
}

export async function getUpcomingEvents(me: Me) {
  return (await fetchRows(upcomingWhere())).map((e) => toVM(e, me));
}

export async function getPastEvents(me: Me, take = 30) {
  const now = new Date();
  const rows = await fetchRows(
    { NOT: upcomingWhere(now), date: { lt: now } },
    "desc",
    take
  );
  return rows.map((e) => toVM(e, me));
}

/** Événements d'une période (pour le calendrier) */
export async function getEventsBetween(me: Me, from: Date, to: Date) {
  const rows = await fetchRows({
    date: { lte: to },
    OR: [{ endDate: { gte: from } }, { endDate: null, date: { gte: from } }],
  });
  return rows.map((e) => toVM(e, me));
}

// cache() : une seule requête par affichage, même si le titre de la page et la page la demandent
const getEventRow = cache(async (id: number) => (await fetchRows({ id }, "asc", 1))[0] ?? null);

export async function getEvent(me: Me, id: number) {
  if (!Number.isInteger(id)) return null;
  const row = await getEventRow(id);
  return row ? toVM(row, me) : null;
}

export const getMembers = cache(async (): Promise<UserVM[]> =>
  prisma.user.findMany({ select: userSelect, orderBy: { pseudo: "asc" } })
);

export async function countPendingFor(meId: number) {
  return prisma.event.count({
    where: { ...upcomingWhere(), rsvps: { none: { userID: meId } } },
  });
}

export type AvailabilityVM = {
  id: number;
  userId: number;
  start: string;
  end: string;
  type: "AVAILABLE" | "BUSY" | "VACATION";
  note: string | null;
  user: UserVM;
};

export async function getAvailabilities(from: Date, to: Date): Promise<AvailabilityVM[]> {
  const rows = await prisma.availability.findMany({
    where: { startDate: { lte: to }, endDate: { gte: from } },
    include: { user: { select: userSelect } },
    orderBy: { startDate: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    userId: a.userId,
    start: a.startDate.toISOString(),
    end: a.endDate.toISOString(),
    type: a.type,
    note: a.note,
    user: a.user,
  }));
}

/** Raccourcis pour le champ "Où ?" : chez chaque membre + lieux récents */
export async function getPlaceSuggestions(meId: number) {
  const [members, recentRows] = await Promise.all([
    getMembers(),
    prisma.event.findMany({
      where: { location: { not: "" } },
      select: { location: true },
      orderBy: { date: "desc" },
      take: 40,
    }),
  ]);
  const hosts = [
    ...members.filter((m) => m.id === meId).map((m) => ({ id: m.id, pseudo: m.pseudo, isMe: true })),
    ...members.filter((m) => m.id !== meId).map((m) => ({ id: m.id, pseudo: m.pseudo, isMe: false })),
  ];
  // Les "Chez X" sont déjà proposés au-dessus : on ne garde que les autres lieux, sans doublon
  const seen = new Set<string>();
  const recent: string[] = [];
  for (const { location } of recentRows) {
    const place = location.trim();
    const key = place.toLowerCase();
    if (!place || key.startsWith("chez ") || seen.has(key) || place.length > 40) continue;
    seen.add(key);
    recent.push(place);
    if (recent.length === 4) break;
  }
  return { hosts, recent };
}
