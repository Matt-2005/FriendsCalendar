import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { isAvailType, rangeFromKeys } from "@/lib/availability";
import { dayKey } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadMine(ctx: Ctx) {
  const meId = await getMeId();
  if (!meId) return { error: NextResponse.json({ error: "Non connecté" }, { status: 401 }) };
  const id = Number((await ctx.params).id);
  const availability = Number.isInteger(id) ? await prisma.availability.findUnique({ where: { id } }) : null;
  if (!availability) return { error: NextResponse.json({ error: "Disponibilité introuvable" }, { status: 404 }) };
  if (availability.userId !== meId) return { error: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  return { availability };
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const res = await loadMine(ctx);
  if (res.error) return res.error;
  await prisma.availability.delete({ where: { id: res.availability.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const res = await loadMine(ctx);
  if (res.error) return res.error;
  const a = res.availability;
  const body = await req.json().catch(() => ({}));

  const startKey = body.start ?? (body.startDate ? dayKey(body.startDate) : dayKey(a.startDate));
  const endKey = body.end ?? (body.endDate ? dayKey(body.endDate) : dayKey(a.endDate));
  if (startKey > endKey) return NextResponse.json({ error: "La fin doit être après le début" }, { status: 400 });
  if (body.type !== undefined && !isAvailType(body.type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  const updated = await prisma.availability.update({
    where: { id: a.id },
    data: {
      ...rangeFromKeys(startKey, endKey),
      ...(body.type ? { type: body.type } : {}),
      ...(body.note !== undefined ? { note: String(body.note || "").trim().slice(0, 140) || null } : {}),
    },
    include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } },
  });
  return NextResponse.json(updated);
}
