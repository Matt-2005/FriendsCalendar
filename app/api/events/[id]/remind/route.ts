import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMe, canManageEvent } from "@/lib/session";
import { sendPush, pushEnabled } from "@/lib/push";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { groupMemberIds } from "@/lib/groups";
import { eventWhen } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";

export const runtime = "nodejs";

// L'organisateur relance ceux qui n'ont pas encore répondu
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!pushEnabled) return NextResponse.json({ error: "Les notifications ne sont pas configurées" }, { status: 503 });

  const event = await prisma.event.findUnique({
    where: { id: Number((await ctx.params).id) },
    include: { rsvps: { select: { userID: true } } },
  });
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
  if (!canManageEvent(me, event)) return NextResponse.json({ error: "Réservé à l'organisateur" }, { status: 403 });

  // Pas plus de 3 relances par heure pour une même sortie
  const limit = rateLimit(`remind:${event.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSec);

  const answered = new Set(event.rsvps.map((r) => r.userID));
  const pending = (await groupMemberIds(event.groupId, me.id)).filter((id) => !answered.has(id));

  await sendPush(pending, {
    title: `${eventEmoji(event.title)} ${event.title}`,
    body: `${me.pseudo} attend ta réponse ! ${eventWhen(event.date, event.endDate)}`,
    url: `/events/${event.id}`,
    tag: `event-${event.id}`,
  });

  return NextResponse.json({ ok: true, count: pending.length });
}
