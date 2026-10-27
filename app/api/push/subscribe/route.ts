import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRealMeId } from "@/lib/session";

// Seuls les vrais services de notification des navigateurs sont acceptés
// (sinon le serveur pourrait être utilisé pour appeler n'importe quelle adresse)
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/, // Chrome, Android, Edge
  /^web\.push\.apple\.com$/, // Safari, iPhone
  /(^|\.)push\.services\.mozilla\.com$/, // Firefox
  /\.notify\.windows\.com$/, // Windows
];
const MAX_DEVICES_PER_USER = 10;

function isPushEndpoint(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

export const runtime = "nodejs";

// Enregistre l'appareil pour recevoir les notifications
export async function POST(req: Request) {
  const meId = await getRealMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const sub = await req.json().catch(() => null);
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!isPushEndpoint(endpoint) || !p256dh || !auth || p256dh.length > 200 || auth.length > 100) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userId: meId },
    update: { p256dh, auth, userId: meId },
  });

  // On garde seulement les appareils les plus récents
  const old = await prisma.pushSubscription.findMany({
    where: { userId: meId },
    orderBy: { createdAt: "desc" },
    skip: MAX_DEVICES_PER_USER,
    select: { id: true },
  });
  if (old.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });

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
