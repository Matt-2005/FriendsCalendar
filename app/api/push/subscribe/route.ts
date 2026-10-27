import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRealMeId } from "@/lib/session";

export const runtime = "nodejs";

// Enregistre l'appareil pour recevoir les notifications
export async function POST(req: Request) {
  const meId = await getRealMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const sub = await req.json().catch(() => null);
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userId: meId },
    update: { p256dh, auth, userId: meId },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const meId = await getRealMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: String(body.endpoint), userId: meId } });
  }
  return NextResponse.json({ ok: true });
}
