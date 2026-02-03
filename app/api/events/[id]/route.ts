import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Autoriser la modification si l'utilisateur est le créateur OU s'il est admin
  if (ev.creatorId !== userId && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Récupérer les données de la requête
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const location = String(body?.location ?? "").trim();
  const dateStr = String(body?.date ?? "");
  const endDateStr = body?.endDate ? String(body.endDate) : null;

  if (!title || !description || !location || !dateStr) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const date = new Date(dateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  if (endDate && isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
  }

  if (endDate && endDate <= date) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
  }

  // Mettre à jour l'événement
  await prisma.event.update({
    where: { id: eventId },
    data: { title, description, location, date, endDate }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

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
