import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { parseEventInput } from "@/lib/eventInput";
import { sendPush, allUserIdsExcept } from "@/lib/push";
import { eventWhen } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { data, error } = parseEventInput(body);
  if (!data) return NextResponse.json({ error }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      ...data,
      creatorId: meId,
      // L'organisateur participe forcément à sa propre sortie
      rsvps: { create: { userID: meId, status: "YES" } },
    },
    include: { creator: { select: { pseudo: true } } },
  });

  if (body?.notify !== false) {
    after(async () => {
      await sendPush(await allUserIdsExcept(meId), {
        title: `${eventEmoji(event.title)} ${event.title}`,
        body: `${event.creator.pseudo} propose : ${eventWhen(event.date, event.endDate)}. Tu viens ?`,
        url: `/events/${event.id}`,
        tag: `event-${event.id}`,
      });
    });
  }

  return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
}

// Liste des événements à venir (utile pour d'éventuelles intégrations)
export async function GET() {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const rows = await prisma.event.findMany({
    where: { OR: [{ endDate: { gte: new Date() } }, { endDate: null, date: { gte: new Date(Date.now() - 6 * 3600e3) } }] },
    orderBy: { date: "asc" },
    take: 200,
    select: { id: true, title: true, date: true, endDate: true, description: true, location: true },
  });
  return NextResponse.json(rows);
}
