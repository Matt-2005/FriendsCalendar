import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { notifyEventDeleted } from "@/lib/notifications";
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
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { select: { userID: true } } },
  });
  if (!ev) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (ev.creatorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  // Récupérer les participants avant de supprimer
  const participantIds = ev.rsvps.map((r) => r.userID).filter((id) => id !== userId);

  // Si pas de cascade en schéma, nettoie les RSVPs
  await prisma.rsvp.deleteMany({ where: { eventID: eventId } });
  await prisma.event.delete({ where: { id: eventId } });

  // Envoyer les notifications
  if (participantIds.length > 0) {
    notifyEventDeleted(ev.title, participantIds).catch((err) =>
      console.error("Error sending notifications:", err)
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
