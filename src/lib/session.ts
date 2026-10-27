import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { cache } from "react";
import { authOptions } from "./authOptions";
import { prisma } from "./prisma";

export type Me = {
  id: number;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
};

/** Utilisateur connecté, ou null. */
export const getMe = cache(async (): Promise<Me | null> => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id ? Number(session.user.id) : null;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, pseudo: true, email: true, avatarUrl: true, role: true },
  });
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

/** Pour les routes API : id de l'utilisateur connecté, ou null. */
export async function getMeId(): Promise<number | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? Number(session.user.id) : null;
}

export function canManageEvent(me: { id: number; role: string }, event: { creatorId: number }) {
  return me.id === event.creatorId || me.role === "ADMIN";
}
