import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { genCalendarToken } from "@/lib/token";

export const runtime = "nodejs";

// Nouveau lien d'agenda : l'ancien arrête de fonctionner
export async function POST() {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const calendarToken = genCalendarToken();
  await prisma.user.update({ where: { id: meId }, data: { calendarToken } });
  return NextResponse.json({ ok: true, calendarToken });
}
