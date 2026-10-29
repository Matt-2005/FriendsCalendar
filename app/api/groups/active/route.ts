import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canSeeGroup, getMe } from "@/lib/session";

export const runtime = "nodejs";

// Changer de groupe affiché
export async function PUT(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const groupId = Number((await req.json().catch(() => null))?.groupId);
  if (!Number.isInteger(groupId) || !canSeeGroup(me, groupId)) {
    return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe" }, { status: 403 });
  }
  const exists = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Groupe introuvable" }, { status: 404 });
  await prisma.user.update({ where: { id: me.id }, data: { activeGroupId: groupId } });
  return NextResponse.json({ ok: true });
}
