// app/api/events/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number((session.user as any).id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const location = String(body?.location ?? "").trim();
  const dateStr = String(body?.date ?? "");
  const date = new Date(dateStr);

  if (!title || !description || !location || isNaN(date.getTime())) {
    return NextResponse.json({ error: "Entrées invalides" }, { status: 400 });
  }

  await prisma.event.create({
    data: { title, description, location, date, creatorId: userId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

// ✅ NOUVEAU: renvoie la liste d’events pour FullCalendar
export async function GET() {
  const rows = await prisma.event.findMany({
    orderBy: { date: "asc" },
    take: 500,
    select: { id: true, title: true, date: true, description: true, location: true },
  });

  const events = rows.map(e => ({
    id: String(e.id),
    title: e.title,
    start: e.date.toISOString(),
    end: new Date(e.date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2h par défaut
    url: `/events/${e.id}`,
    extendedProps: {
      description: e.description,
      location: e.location,
    },
  }));

  return NextResponse.json(events);
}
