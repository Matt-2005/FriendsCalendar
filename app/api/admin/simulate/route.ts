import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRealMe, SIMULATE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

// L'admin se met "dans la peau" d'un membre : tout ce qu'il fait compte pour ce membre
export async function POST(req: Request) {
  const real = await getRealMe();
  if (!real || real.role !== "ADMIN") return NextResponse.json({ error: "Réservé à l'admin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const userId = Number(body?.userId);
  const target = Number.isInteger(userId)
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, pseudo: true } })
    : null;
  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const res = NextResponse.json({ ok: true, pseudo: target.pseudo });
  if (target.id === real.id) {
    res.cookies.delete(SIMULATE_COOKIE);
  } else {
    res.cookies.set(SIMULATE_COOKIE, String(target.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // s'arrête tout seul au bout de 12 h
    });
  }
  return res;
}

// Revenir à son propre compte
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SIMULATE_COOKIE);
  return res;
}
