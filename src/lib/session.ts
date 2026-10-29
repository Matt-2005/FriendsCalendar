import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { authOptions } from "./authOptions";
import { prisma } from "./prisma";

export type GroupRole = "MEMBER" | "MANAGER";

export type Me = {
  id: number;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  /** ADMIN = super admin de toute l'appli (toi). Les admins de groupe sont dans `memberships`. */
  role: "USER" | "ADMIN";
  activeGroupId: number | null;
  /** Groupes dont la personne est membre (demandes acceptées seulement) */
  memberships: { groupId: number; role: GroupRole; group: { name: string; code: string } }[];
  /** Rempli quand un admin utilise l'app "dans la peau" de ce membre */
  simulatedBy?: { id: number; pseudo: string } | null;
};

/** Le groupe affiché en ce moment */
export type GroupCtx = {
  id: number;
  name: string;
  code: string;
  /** null : super admin qui regarde un groupe dont il ne fait pas partie */
  myRole: GroupRole | null;
  canManage: boolean;
};

/** Cookie posé par l'admin pour agir à la place d'un membre */
export const SIMULATE_COOKIE = "simulate_as";

const userSelect = {
  id: true,
  pseudo: true,
  email: true,
  avatarUrl: true,
  role: true,
  activeGroupId: true,
  memberships: {
    where: { status: "ACTIVE" },
    select: { groupId: true, role: true, group: { select: { name: true, code: true } } },
    orderBy: { createdAt: "asc" },
  },
} as const;

async function sessionUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? Number(session.user.id) : null;
}

async function simulatedId(): Promise<number | null> {
  const raw = (await cookies()).get(SIMULATE_COOKIE)?.value;
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) ? id : null;
}

/** La personne réellement connectée, sans tenir compte de la simulation. */
export const getRealMe = cache(async (): Promise<Me | null> => {
  const id = await sessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, select: userSelect });
});

/**
 * Utilisateur "courant", ou null.
 * Si un admin simule un membre, c'est ce membre qui est renvoyé :
 * tout ce que l'admin fait est enregistré pour lui, pour de vrai.
 */
export const getMe = cache(async (): Promise<Me | null> => {
  const real = await getRealMe();
  if (!real) return null;
  const targetId = await simulatedId();
  // Le rôle est relu en base à chaque requête : un cookie forgé par un non-admin ne sert à rien
  if (!targetId || targetId === real.id || real.role !== "ADMIN") return real;
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: userSelect });
  if (!target) return real;
  return { ...target, simulatedBy: { id: real.id, pseudo: real.pseudo } };
});

/** Pour les pages : renvoie vers la connexion si besoin. */
export async function requireMe(callbackUrl?: string): Promise<Me> {
  const me = await getMe();
  if (!me) {
    const target = callbackUrl ?? (await headers()).get("x-pathname") ?? "/events";
    redirect(`/login?callbackUrl=${encodeURIComponent(target)}`);
  }
  return me;
}

/** Pour les routes API : id de l'utilisateur courant (simulé le cas échéant), ou null. */
export async function getMeId(): Promise<number | null> {
  // Cas courant sans simulation : pas de requête en base
  if (!(await simulatedId())) return sessionUserId();
  return (await getMe())?.id ?? null;
}

/** Id de la personne qui tient réellement le téléphone (notifications de l'appareil). */
export async function getRealMeId(): Promise<number | null> {
  return sessionUserId();
}

/** Le groupe affiché : celui choisi s'il est toujours accessible, sinon le premier. */
export const getGroup = cache(async (): Promise<GroupCtx | null> => {
  const me = await getMe();
  if (!me) return null;
  const pick =
    me.memberships.find((m) => m.groupId === me.activeGroupId) ??
    (isSuperAdmin(me) ? null : me.memberships[0]);
  if (pick) {
    return { id: pick.groupId, ...pick.group, myRole: pick.role, canManage: isSuperAdmin(me) || pick.role === "MANAGER" };
  }
  if (!isSuperAdmin(me)) return null;
  // Le super admin peut regarder n'importe quel groupe, même sans en faire partie
  const group =
    (me.activeGroupId ? await prisma.group.findUnique({ where: { id: me.activeGroupId } }) : null) ??
    (me.memberships[0] ? await prisma.group.findUnique({ where: { id: me.memberships[0].groupId } }) : null) ??
    (await prisma.group.findFirst({ orderBy: { id: "asc" } }));
  if (!group) return null;
  const role = me.memberships.find((m) => m.groupId === group.id)?.role ?? null;
  return { id: group.id, name: group.name, code: group.code, myRole: role, canManage: true };
});

/** Pour les pages de l'appli : connecté ET dans un groupe, sinon écran « Rejoindre un groupe ». */
export async function requireGroup(): Promise<{ me: Me; group: GroupCtx }> {
  const me = await requireMe();
  const group = await getGroup();
  if (!group) redirect("/join");
  return { me, group };
}

/** Super admin de toute l'appli (unique) */
export function isSuperAdmin(me: { role: string }) {
  return me.role === "ADMIN";
}

export function isMemberOf(me: Me, groupId: number) {
  return me.memberships.some((m) => m.groupId === groupId);
}

/** Voir le contenu d'un groupe : ses membres et le super admin */
export function canSeeGroup(me: Me, groupId: number) {
  return isSuperAdmin(me) || isMemberOf(me, groupId);
}

/** Administrer un groupe (accepter les membres…) : ses admins et le super admin */
export function canManageGroup(me: Me, groupId: number) {
  return isSuperAdmin(me) || me.memberships.some((m) => m.groupId === groupId && m.role === "MANAGER");
}

/** Modifier / supprimer une sortie : l'organisateur, les admins du groupe, le super admin */
export function canManageEvent(me: Me, event: { creatorId: number; groupId: number }) {
  return me.id === event.creatorId || canManageGroup(me, event.groupId);
}
