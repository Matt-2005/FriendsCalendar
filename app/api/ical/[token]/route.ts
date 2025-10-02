// app/api/ical/[token]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ical, { ICalEventStatus } from "ical-generator";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    // ✅ strip .ics si ajouté dans l’URL
    const raw = params.token || "";
    const token = raw.endsWith(".ics") ? raw.slice(0, -4) : raw;

    const user = await prisma.user.findUnique({
      where: { calendarToken: token },
      select: { id: true, pseudo: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: { rsvps: { where: { userID: user.id }, select: { status: true } } },
    });

    const cal = ical({
      name: "Les Indécis Agenda",
      prodId: { company: "lesindecis", product: "agenda", language: "FR" },
      timezone: "UTC",
    });

    for (const e of events) {
      const my = e.rsvps[0]?.status ?? null; // null = attente
      if (my === "NO") continue;

      cal.createEvent({
        id: `event-${e.id}@lesindecis.fr`,
        start: e.date,
        end: new Date(e.date.getTime() + 2 * 60 * 60 * 1000),
        summary: e.title,
        description: e.description ?? "",
        location: e.location ?? "",
        status: my === "YES" ? ICalEventStatus.CONFIRMED : ICalEventStatus.TENTATIVE,
        url: "https://lesindeciscalendar.fr/events",
      });
    }

    return new NextResponse(cal.toString(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="les-indecis.ics"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("ICS_ROUTE_ERROR:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
