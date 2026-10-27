import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { getBaseUrl } from "@/lib/url";
import { addEvent, icsResponse, newCalendar, type MyStatus } from "@/lib/ics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fichier .ics d'un seul événement : "Ajouter à mon agenda" (garde les rappels sur iPhone)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const meId = await getMeId();
  if (!meId) return NextResponse.redirect(new URL("/login", await getBaseUrl()));

  const raw = (await ctx.params).id.replace(/\.ics$/, "");
  const event = await prisma.event.findUnique({
    where: { id: Number(raw) },
    include: {
      creator: { select: { pseudo: true } },
      rsvps: { where: { userID: meId }, select: { status: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });

  const cal = newCalendar(event.title);
  // On l'ajoute comme "J'y vais" pour avoir les rappels, sauf si on a dit "peut-être"
  const status: MyStatus = event.rsvps[0]?.status === "MAYBE" ? "MAYBE" : "YES";
  addEvent(cal, event, status, await getBaseUrl());
  return icsResponse(cal, `sortie-${event.id}.ics`);
}
