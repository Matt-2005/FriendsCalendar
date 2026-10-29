import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGroup, getMeId } from "@/lib/session";
import { isAvailType, rangeFromKeys } from "@/lib/availability";
import { dayKey } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const group = await getGroup();
  if (!group) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const availabilities = await prisma.availability.findMany({
    where: {
      endDate: { gte: new Date(Date.now() - 31 * 24 * 3600e3) },
      user: { memberships: { some: { groupId: group.id, status: "ACTIVE" } } },
    },
    include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(availabilities);
}

// Ajouter une période (ex : vacances du 12 au 20)
// Accepte { start: "YYYY-MM-DD", end: "YYYY-MM-DD" } ou les anciens { startDate, endDate } en ISO
export async function POST(req: NextRequest) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  let startKey: string | undefined = body?.start;
  let endKey: string | undefined = body?.end;
  if (!startKey && body?.startDate) startKey = dayKey(body.startDate);
  if (!endKey && body?.endDate) endKey = dayKey(body.endDate);

  if (!startKey || !endKey || !KEY_RE.test(startKey) || !KEY_RE.test(endKey)) {
    return NextResponse.json({ error: "Choisis une date de début et de fin" }, { status: 400 });
  }
  if (startKey > endKey) [startKey, endKey] = [endKey, startKey];
  if (!isAvailType(body?.type)) return NextResponse.json({ error: "Type invalide" }, { status: 400 });

  const availability = await prisma.availability.create({
    data: {
      userId: meId,
      ...rangeFromKeys(startKey, endKey),
      type: body.type,
      note: body?.note ? String(body.note).trim().slice(0, 140) || null : null,
    },
    include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } },
  });

  return NextResponse.json(availability, { status: 201 });
}
