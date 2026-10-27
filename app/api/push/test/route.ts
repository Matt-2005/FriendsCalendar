import { NextResponse } from "next/server";
import { getRealMeId } from "@/lib/session";
import { sendPush, pushEnabled } from "@/lib/push";

export const runtime = "nodejs";

export async function POST() {
  const meId = await getRealMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!pushEnabled) return NextResponse.json({ error: "Notifications non configurées sur le serveur" }, { status: 503 });
  await sendPush([meId], {
    title: "Ça marche ! 🎉",
    body: "Tu recevras ici les nouvelles sorties et les rappels.",
    url: "/events",
    tag: "test",
  });
  return NextResponse.json({ ok: true });
}
