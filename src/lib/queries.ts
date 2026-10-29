import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { eventEmoji } from "./eventEmoji";
import { canManageEvent, canSeeGroup, isSuperAdmin, type Me } from "./session";

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
  groupId: number;
  groupName: string;
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
      group: { select: { name: true } },
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
    canManage: canManageEvent(me, e),
    groupId: e.groupId,
    groupName: e.group.name,
  };
}

export async function getUpcomingEvents(me: Me, groupId: number) {
  return (await fetchRows({ groupId, ...upcomingWhere() })).map((e) => toVM(e, me));
}

export async function getPastEvents(me: Me, groupId: number, take = 30) {
  const now = new Date();
  const rows = await fetchRows(
    { groupId, NOT: upcomingWhere(now), date: { lt: now } },
    "desc",
    take
  );
  return rows.map((e) => toVM(e, me));
}

/** Événements d'une période (pour le calendrier) */
export async function getEventsBetween(me: Me, groupId: number, from: Date, to: Date) {
  const rows = await fetchRows({
    groupId,
    date: { lte: to },
    OR: [{ endDate: { gte: from } }, { endDate: null, date: { gte: from } }],
  });
  return rows.map((e) => toVM(e, me));
}

// cache() : une seule requête par affichage, même si le titre de la page et la page la demandent
const getEventRow = cache(async (id: number) => (await fetchRows({ id }, "asc", 1))[0] ?? null);

/** Une sortie, seulement si on a accès à son groupe (sinon « introuvable ») */
export async function getEvent(me: Me, id: number) {
  if (!Number.isInteger(id)) return null;
  const row = await getEventRow(id);
  return row && canSeeGroup(me, row.groupId) ? toVM(row, me) : null;
}

/** Membres acceptés d'un groupe */
export const getMembers = cache(async (groupId: number): Promise<UserVM[]> =>
  prisma.user.findMany({
    where: { memberships: { some: { groupId, status: "ACTIVE" } } },
    select: userSelect,
    orderBy: { pseudo: "asc" },
  })
);

export async function countPendingFor(meId: number, groupId: number) {
  return prisma.event.count({
    where: { groupId, ...upcomingWhere(), rsvps: { none: { userID: meId } } },
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

/** Dispos des membres d'un groupe (les dispos sont personnelles : les mêmes dans tous ses groupes) */
export async function getAvailabilities(groupId: number, from: Date, to: Date): Promise<AvailabilityVM[]> {
  const rows = await prisma.availability.findMany({
    where: {
      startDate: { lte: to },
      endDate: { gte: from },
      user: { memberships: { some: { groupId, status: "ACTIVE" } } },
    },
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
export async function getPlaceSuggestions(meId: number, groupId: number) {
  const [members, recentRows] = await Promise.all([
    getMembers(groupId),
    prisma.event.findMany({
      where: { groupId, location: { not: "" } },
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

export type GroupChoice = { id: number; name: string; isMember: boolean; members: number; pending: number };

/** Groupes entre lesquels on peut basculer : les siens, ou tous pour le super admin */
export const getSwitchableGroups = cache(async (me: Me): Promise<GroupChoice[]> => {
  const mine = new Set(me.memberships.map((m) => m.groupId));
  const rows = await prisma.group.findMany({
    where: isSuperAdmin(me) ? {} : { id: { in: [...mine] } },
    select: { id: true, name: true, memberships: { select: { status: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((g) => ({
    id: g.id,
    name: g.name,
    isMember: mine.has(g.id),
    members: g.memberships.filter((m) => m.status === "ACTIVE").length,
    pending: g.memberships.filter((m) => m.status === "PENDING").length,
  }));
});

export type GroupMemberVM = UserVM & { email: string; role: "MEMBER" | "MANAGER"; isSuperAdmin: boolean; since: string };

/** Membres et demandes en attente d'un groupe (écran d'administration) */
export async function getGroupMembers(groupId: number) {
  const rows = await prisma.membership.findMany({
    where: { groupId },
    select: {
      role: true,
      status: true,
      createdAt: true,
      user: { select: { ...userSelect, email: true, role: true } },
    },
    orderBy: [{ user: { pseudo: "asc" } }],
  });
  const vm = (r: (typeof rows)[number]): GroupMemberVM => ({
    id: r.user.id,
    pseudo: r.user.pseudo,
    avatarUrl: r.user.avatarUrl,
    email: r.user.email,
    role: r.role,
    isSuperAdmin: r.user.role === "ADMIN",
    since: r.createdAt.toISOString(),
  });
  return {
    members: rows.filter((r) => r.status === "ACTIVE").map(vm),
    pending: rows.filter((r) => r.status === "PENDING").map(vm),
  };
}
