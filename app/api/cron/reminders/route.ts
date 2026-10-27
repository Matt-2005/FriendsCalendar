import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";
import { dayKey, fmtTime, parisDayEnd, parisDayStart, todayKey, addDaysToKey } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tâche quotidienne (voir vercel.json) :
 * - "C'est aujourd'hui" aux participants des sorties du jour
 * - "Tu n'as pas répondu" pour les sorties de demain
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = todayKey();
  const tomorrow = addDaysToKey(today, 1);
  const users = await prisma.user.findMany({ select: { id: true } });
  let sent = 0;

  const todays = await prisma.event.findMany({
    where: { date: { gte: new Date(), lte: parisDayEnd(today) }, reminderSentAt: null },
    include: { rsvps: true },
  });
  for (const e of todays) {
    const going = e.rsvps.filter((r) => r.status !== "NO").map((r) => r.userID);
    const count = e.rsvps.filter((r) => r.status === "YES").length;
    await sendPush(going, {
      title: `${eventEmoji(e.title)} C'est aujourd'hui !`,
      body: `${e.title} à ${fmtTime(e.date)}${e.location ? ` · ${e.location}` : ""} — ${count} participant${count > 1 ? "s" : ""}`,
      url: `/events/${e.id}`,
      tag: `event-${e.id}`,
    });
    await prisma.event.update({ where: { id: e.id }, data: { reminderSentAt: new Date() } });
    sent += going.length;
  }

  const tomorrows = await prisma.event.findMany({
    where: { date: { gte: parisDayStart(tomorrow), lte: parisDayEnd(tomorrow) } },
    include: { rsvps: { select: { userID: true } } },
  });
  for (const e of tomorrows) {
    if (dayKey(e.date) !== tomorrow) continue;
    const answered = new Set(e.rsvps.map((r) => r.userID));
    const pending = users.map((u) => u.id).filter((id) => !answered.has(id));
    await sendPush(pending, {
      title: `${eventEmoji(e.title)} Demain : ${e.title}`,
      body: `À ${fmtTime(e.date)}. Tu n'as pas encore dit si tu venais 👀`,
      url: `/events/${e.id}`,
      tag: `event-${e.id}`,
    });
    sent += pending.length;
  }

  return NextResponse.json({ ok: true, today: todays.length, tomorrow: tomorrows.length, sent });
}

/** Compare la clé en temps constant (évite de la deviner caractère par caractère) */
function isAuthorizedCron(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
