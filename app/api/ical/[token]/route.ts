// app/api/ical/[token]/route.ts
export const runtime = "nodejs";         // 👈 impératif pour ical-generator
export const dynamic = "force-dynamic";  // évite le cache ISR pour un flux vivant

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ical, { ICalEventStatus } from "ical-generator";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { calendarToken: params.token },
      select: { id: true, pseudo: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
    });

    for (const e of events) {
      const myStatus = e.rsvps[0]?.status ?? null; // null = en attente
      if (myStatus === "NO") continue;

      cal.createEvent({
        id: `event-${e.id}@lesindecis.fr`, // UID stable
        start: e.date,
        end: new Date(e.date.getTime() + 2 * 60 * 60 * 1000),
        summary: e.title,
        description: e.description ?? "",
        location: e.location ?? "",
        status: myStatus === "YES" 
          ? ICalEventStatus.CONFIRMED 
          : ICalEventStatus.TENTATIVE,   // ← au lieu de "CONFIRMED"/"TENTATIVE"
        url: `https://ton-domaine.fr/events`,
      });
    }

    const body = cal.toString();

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="les-indecis.ics"', // ou attachment;
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("ICS_ROUTE_ERROR:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
