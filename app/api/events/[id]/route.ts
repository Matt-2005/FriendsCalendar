import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // 👈 Promise
  ) {
  const { id } = await params; // 👈 await
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const eventId = Number(id);
  const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, creatorId: true } });
  if (!ev) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  
  // Récupérer le rôle de l'utilisateur
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { role: true }
  });

  // Autoriser la suppression si l'utilisateur est le créateur OU s'il est admin
  if (ev.creatorId !== userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Si pas de cascade en schéma, nettoie les RSVPs
  await prisma.rsvp.deleteMany({ where: { eventID: eventId } });
  await prisma.event.delete({ where: { id: eventId } });

  return NextResponse.json({ ok: true }, { status: 200 });
}
