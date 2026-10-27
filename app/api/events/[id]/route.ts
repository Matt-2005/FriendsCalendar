import { NextResponse, after, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMe, canManageEvent } from "@/lib/session";
import { parseEventInput } from "@/lib/eventInput";
import { sendPush } from "@/lib/push";
import { eventWhen } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function loadForManage(ctx: Ctx) {
  const me = await getMe();
  if (!me) return { error: NextResponse.json({ error: "Non connecté" }, { status: 401 }) };
  const eventId = Number((await ctx.params).id);
  if (!Number.isInteger(eventId)) return { error: NextResponse.json({ error: "Introuvable" }, { status: 404 }) };
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: { select: { userID: true, status: true } } },
  });
  if (!event) return { error: NextResponse.json({ error: "Événement introuvable" }, { status: 404 }) };
  if (!canManageEvent(me, event)) {
    return { error: NextResponse.json({ error: "Seul l'organisateur peut faire ça" }, { status: 403 }) };
  }
  return { me, event };
}

/** Personnes concernées : celles qui viennent ou hésitent (sauf moi) */
function interested(event: { rsvps: { userID: number; status: string }[] }, meId: number) {
  return event.rsvps.filter((r) => r.status !== "NO" && r.userID !== meId).map((r) => r.userID);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const res = await loadForManage(ctx);
  if (res.error) return res.error;
  const { me, event } = res;

  const { data, error } = parseEventInput(await req.json().catch(() => null));
  if (!data) return NextResponse.json({ error }, { status: 400 });

  const timeChanged =
    data.date.getTime() !== event.date.getTime() ||
    (data.endDate?.getTime() ?? null) !== (event.endDate?.getTime() ?? null);
  const placeChanged = data.location !== event.location;

  await prisma.event.update({
    where: { id: event.id },
    data: { ...data, ...(timeChanged ? { reminderSentAt: null } : {}) },
  });

  if (timeChanged || placeChanged) {
    const changes = [
      timeChanged && `nouvel horaire : ${eventWhen(data.date, data.endDate)}`,
      placeChanged && (data.location ? `nouveau lieu : ${data.location}` : "lieu modifié"),
    ].filter(Boolean).join(", ");
    after(() =>
      sendPush(interested(event, me.id), {
        title: `✏️ ${data.title} a changé`,
        body: changes.charAt(0).toUpperCase() + changes.slice(1),
        url: `/events/${event.id}`,
        tag: `event-${event.id}`,
      })
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const res = await loadForManage(ctx);
  if (res.error) return res.error;
  const { me, event } = res;

  const toNotify = event.date > new Date() ? interested(event, me.id) : [];
  await prisma.event.delete({ where: { id: event.id } });

  after(() =>
    sendPush(toNotify, {
      title: `❌ ${event.title} est annulé`,
      body: `${eventEmoji(event.title)} Prévu ${eventWhen(event.date).toLowerCase()} — annulé par l'organisateur.`,
      url: `/events`,
      tag: `event-${event.id}`,
    })
  );

  return NextResponse.json({ ok: true });
}
