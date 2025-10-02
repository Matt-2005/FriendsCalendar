// app/api/rsvp/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userIdStr = session?.user?.id;
  if (!userIdStr) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const eventId = Number(body?.eventId);
  const status = String(body?.status ?? "").toUpperCase();

  if (!eventId || (status !== "YES" && status !== "NO")) {
    return NextResponse.json({ error: "Entrées invalides" }, { status: 400 });
  }

  // Vérifie que l'event existe (optionnel mais propre)
  const exists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Évènement introuvable" }, { status: 404 });

  await prisma.rsvp.upsert({
    where: { userID_eventID: { userID: Number(userIdStr), eventID: eventId } },
    create: { userID: Number(userIdStr), eventID: eventId, status: status as any },
    update: { status: status as any },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
