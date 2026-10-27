import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMe } from "@/lib/session";
import { sendPush } from "@/lib/push";

export const runtime = "nodejs";

const STATUSES = ["YES", "NO", "MAYBE"] as const;
type Status = (typeof STATUSES)[number];

const LABEL: Record<Status, string> = {
  YES: "vient",
  MAYBE: "viendra peut-être",
  NO: "ne pourra pas venir",
};

export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const eventId = Number(body?.eventId);
  const status = String(body?.status ?? "").toUpperCase() as Status;

  if (!Number.isInteger(eventId) || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, creatorId: true },
  });
  if (!event) return NextResponse.json({ error: "Cet événement n'existe plus" }, { status: 404 });

  const previous = await prisma.rsvp.findUnique({
    where: { userID_eventID: { userID: me.id, eventID: eventId } },
    select: { status: true },
  });

  await prisma.rsvp.upsert({
    where: { userID_eventID: { userID: me.id, eventID: eventId } },
    create: { userID: me.id, eventID: eventId, status },
    update: { status },
  });

  // Prévenir l'organisateur (une seule fois par changement réel)
  if (event.creatorId !== me.id && previous?.status !== status) {
    after(() =>
      sendPush([event.creatorId], {
        title: event.title,
        body: `${me.pseudo} ${LABEL[status]} ${status === "YES" ? "🎉" : status === "MAYBE" ? "🤔" : "😢"}`,
        url: `/events/${event.id}`,
        tag: `rsvp-${event.id}-${me.id}`,
      })
    );
  }

  return NextResponse.json({ ok: true, status });
}

// Retirer sa réponse
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const eventId = Number(new URL(req.url).searchParams.get("eventId"));
  if (!Number.isInteger(eventId)) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  await prisma.rsvp.deleteMany({ where: { userID: me.id, eventID: eventId } });
  return NextResponse.json({ ok: true });
}
