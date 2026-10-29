import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { canSeeGroup, getGroup, getMe } from "@/lib/session";
import { parseEventInput } from "@/lib/eventInput";
import { sendPush } from "@/lib/push";
import { groupMemberIds } from "@/lib/groups";
import { eventWhen } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const meId = me.id;

  const body = await req.json().catch(() => null);
  const { data, error } = parseEventInput(body);
  if (!data) return NextResponse.json({ error }, { status: 400 });

  // Le groupe affiché quand le formulaire a été ouvert (sinon le groupe courant)
  const groupId = Number.isInteger(body?.groupId) ? Number(body.groupId) : (await getGroup())?.id;
  if (!groupId || !canSeeGroup(me, groupId)) {
    return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe" }, { status: 403 });
  }

  const event = await prisma.event.create({
    data: {
      ...data,
      groupId,
      creatorId: meId,
      // L'organisateur participe forcément à sa propre sortie
      rsvps: { create: { userID: meId, status: "YES" } },
    },
    include: { creator: { select: { pseudo: true } } },
  });

  if (body?.notify !== false) {
    after(async () => {
      await sendPush(await groupMemberIds(groupId, meId), {
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
  const group = await getGroup();
  if (!group) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const rows = await prisma.event.findMany({
    where: { groupId: group.id, OR: [{ endDate: { gte: new Date() } }, { endDate: null, date: { gte: new Date(Date.now() - 6 * 3600e3) } }] },
    orderBy: { date: "asc" },
    take: 200,
    select: { id: true, title: true, date: true, endDate: true, description: true, location: true },
  });
  return NextResponse.json(rows);
}
