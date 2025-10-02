import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const eventId = Number(params.id);
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, creatorId: true } });
  if (!ev) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (ev.creatorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Si pas de cascade en schéma, nettoie les RSVPs
  await prisma.rsvp.deleteMany({ where: { eventID: eventId } });
  await prisma.event.delete({ where: { id: eventId } });

  return NextResponse.json({ ok: true }, { status: 200 });
}
