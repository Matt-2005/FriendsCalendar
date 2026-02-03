// app/api/ical/[token]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ical, { ICalEventStatus } from "ical-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }   // 👈 Promise
) {
  const { token: rawToken } = await params;             // 👈 await
  const token = rawToken.endsWith(".ics") ? rawToken.slice(0, -4) : rawToken;

  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
    select: { id: true, pseudo: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: {
      rsvps: { where: { userID: user.id }, select: { status: true } },
    },
  });

  const cal = ical({
    name: "Les Indécis Agenda",
    prodId: { company: "lesindecis", product: "agenda", language: "FR" },
    timezone: "UTC",
    ttl: 60, // Suggère un rafraîchissement toutes les 60 secondes (1 minute)
  });

  for (const e of events) {
    const my = e.rsvps[0]?.status ?? null; // null = sans réponse
    
    // Utiliser endDate si disponible, sinon ajouter 2h par défaut
    const eventEnd = e.endDate 
      ? e.endDate 
      : new Date(e.date.getTime() + 2 * 60 * 60 * 1000);

    // Si l'utilisateur a refusé, créer un événement ANNULÉ pour le supprimer du calendrier
    if (my === "NO") {
      cal.createEvent({
        id: `event-${e.id}@lesindecis.fr`,
        start: e.date,
        end: eventEnd,
        summary: e.title,
        description: e.description ?? "",
        location: e.location ?? "",
        status: ICalEventStatus.CANCELLED, // ⬅️ CANCELLED pour supprimer l'événement
        url: "https://lesindeciscalendar.fr/events",
      });
      continue;
    }

    // Tous les autres événements (YES ou sans réponse) sont confirmés
    cal.createEvent({
      id: `event-${e.id}@lesindecis.fr`,
      start: e.date,
      end: eventEnd,
      summary: e.title,
      description: e.description ?? "",
      location: e.location ?? "",
      status: ICalEventStatus.CONFIRMED,
      url: "https://lesindeciscalendar.fr/events",
    });
  }

  return new NextResponse(cal.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="les-indecis.ics"',
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Published-TTL": "PT1M", // Durée de 1 minute (format ISO 8601)
    },
  });
}
