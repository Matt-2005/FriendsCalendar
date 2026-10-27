import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import { addEvent, icsResponse, newCalendar } from "@/lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Flux d'abonnement personnel (Apple Calendar, Google Agenda, Outlook…)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await params;
  const token = rawToken.replace(/\.ics$/, "");

  const user = await prisma.user.findUnique({
    where: { calendarToken: token },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Lien d'agenda invalide ou régénéré" }, { status: 404 });

  // On garde les 60 derniers jours pour que les sorties passées ne disparaissent pas des agendas
  const since = new Date(Date.now() - 60 * 24 * 3600e3);
  const events = await prisma.event.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    include: {
      creator: { select: { pseudo: true } },
      rsvps: { where: { userID: user.id }, select: { status: true } },
    },
  });

  const baseUrl = await getBaseUrl();
  const cal = newCalendar();
  for (const e of events) {
    const status = e.rsvps[0]?.status ?? null;
    if (status === "NO") continue; // Les sorties refusées n'encombrent pas l'agenda
    addEvent(cal, e, status, baseUrl);
  }

  return icsResponse(cal, "les-indecis.ics");
}
