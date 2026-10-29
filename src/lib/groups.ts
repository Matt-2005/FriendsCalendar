import "server-only";
import { randomInt } from "crypto";
import { prisma } from "./prisma";

// Pas de 0/O, 1/I/L : facile à dicter et à recopier
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genGroupCode(length = 6) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** « ab3-k7p » → « AB3K7P » (les gens tapent comme ils veulent) */
export function normalizeCode(raw: unknown) {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

/** Crée un code qui n'existe pas encore */
export async function uniqueGroupCode() {
  for (;;) {
    const code = genGroupCode();
    if (!(await prisma.group.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
}

export const findGroupByCode = (raw: unknown) => {
  const code = normalizeCode(raw);
  return code ? prisma.group.findUnique({ where: { code }, select: { id: true, name: true, code: true } }) : null;
};

/** Membres (acceptés) d'un groupe, sauf ceux exclus */
export async function groupMemberIds(groupId: number, ...exclude: number[]) {
  const rows = await prisma.membership.findMany({ where: { groupId, status: "ACTIVE" }, select: { userId: true } });
  return rows.map((r) => r.userId).filter((id) => !exclude.includes(id));
}

/** Qui prévenir quand quelqu'un demande à rejoindre : les admins du groupe, sinon le super admin */
export async function groupManagerIds(groupId: number) {
  const managers = await prisma.membership.findMany({
    where: { groupId, status: "ACTIVE", role: "MANAGER" },
    select: { userId: true },
  });
  if (managers.length) return managers.map((m) => m.userId);
  const supers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  return supers.map((u) => u.id);
}

export const GROUP_NAME_MAX = 40;

/** Quitter / être retiré d'un groupe : on enlève aussi ses réponses aux sorties à venir de ce groupe */
export async function removeMembership(userId: number, groupId: number) {
  await prisma.$transaction([
    prisma.rsvp.deleteMany({ where: { userID: userId, event: { groupId, date: { gte: new Date() } } } }),
    prisma.membership.deleteMany({ where: { userId, groupId } }),
  ]);
}
