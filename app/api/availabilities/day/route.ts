import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import { isAvailType, rangeFromKeys } from "@/lib/availability";
import { addDaysToKey, dayKey, parisDayEnd, parisDayStart } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Définit MON statut pour un ou plusieurs jours : { days: ["2026-11-02", …], type: "AVAILABLE" | "BUSY" | "VACATION" | null }
 * Les périodes existantes qui chevauchent ces jours sont découpées proprement.
 */
export async function PUT(req: NextRequest) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const days: string[] = Array.isArray(body?.days) ? body.days : body?.day ? [body.day] : [];
  const type = body?.type ?? null;

  if (days.length === 0 || days.length > 62 || !days.every((d) => typeof d === "string" && KEY_RE.test(d))) {
    return NextResponse.json({ error: "Jours invalides" }, { status: 400 });
  }
  if (type !== null && !isAvailType(type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const key of [...new Set(days)].sort()) {
      const overlapping = await tx.availability.findMany({
        where: { userId: meId, startDate: { lte: parisDayEnd(key) }, endDate: { gte: parisDayStart(key) } },
      });
      for (const a of overlapping) {
        const aStart = dayKey(a.startDate);
        const aEnd = dayKey(a.endDate);
        await tx.availability.delete({ where: { id: a.id } });
        // On recrée les morceaux avant et après le jour modifié
        if (aStart < key) {
          await tx.availability.create({
            data: { userId: meId, type: a.type, note: a.note, ...rangeFromKeys(aStart, addDaysToKey(key, -1)) },
          });
        }
        if (aEnd > key) {
          await tx.availability.create({
            data: { userId: meId, type: a.type, note: a.note, ...rangeFromKeys(addDaysToKey(key, 1), aEnd) },
          });
        }
      }
      if (type) {
        await tx.availability.create({ data: { userId: meId, type, ...rangeFromKeys(key, key) } });
      }
    }
  }, { timeout: 15000, maxWait: 5000 });

  return NextResponse.json({ ok: true });
}
