import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const pseudo = String(body?.pseudo ?? "").trim().slice(0, 40);

  if (!pseudo) return NextResponse.json({ error: "Choisis un prénom ou un pseudo" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }

  const taken = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, id: { not: meId } },
    select: { id: true },
  });
  if (taken) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

  const user = await prisma.user.update({ where: { id: meId }, data: { email, pseudo } });
  return NextResponse.json({ ok: true, user: { email: user.email, pseudo: user.pseudo } });
}
