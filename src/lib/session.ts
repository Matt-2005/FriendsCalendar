import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { authOptions } from "./authOptions";
import { prisma } from "./prisma";

export type Me = {
  id: number;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  /** Rempli quand un admin utilise l'app "dans la peau" de ce membre */
  simulatedBy?: { id: number; pseudo: string } | null;
};

/** Cookie posé par l'admin pour agir à la place d'un membre */
export const SIMULATE_COOKIE = "simulate_as";

const userSelect = { id: true, pseudo: true, email: true, avatarUrl: true, role: true } as const;

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

export function canManageEvent(me: { id: number; role: string }, event: { creatorId: number }) {
  return me.id === event.creatorId || me.role === "ADMIN";
}
