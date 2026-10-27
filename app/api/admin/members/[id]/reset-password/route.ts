import { NextResponse, type NextRequest } from "next/server";
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { getMe } from "@/lib/session";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

const WORDS = ["pizza", "apero", "soleil", "banane", "tigre", "plage", "cactus", "mojito", "tacos", "fusee", "kiwi", "panda"];

// L'admin génère un mot de passe provisoire facile à dicter
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me || me.role !== "ADMIN") return NextResponse.json({ error: "Réservé à l'admin" }, { status: 403 });
  const limit = rateLimit(`admin-reset:${me.id}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSec);

  const userId = Number((await ctx.params).id);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const password = `${WORDS[randomInt(WORDS.length)]}-${WORDS[randomInt(WORDS.length)]}-${randomInt(10, 100)}`;
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  return NextResponse.json({ ok: true, password });
}
