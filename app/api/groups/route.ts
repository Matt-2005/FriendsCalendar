import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMe, isSuperAdmin } from "@/lib/session";
import { GROUP_NAME_MAX, uniqueGroupCode } from "@/lib/groups";

export const runtime = "nodejs";

// Créer un groupe : réservé au super admin
export async function POST(req: Request) {
  const me = await getMe();
  if (!me || !isSuperAdmin(me)) return NextResponse.json({ error: "Réservé au super admin" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim().slice(0, GROUP_NAME_MAX);
  if (!name) return NextResponse.json({ error: "Donne un nom au groupe" }, { status: 400 });

  const group = await prisma.group.create({
    data: {
      name,
      code: await uniqueGroupCode(),
      // Coché : le super admin en fait partie (il reçoit les sorties et les notifications)
      ...(body?.join ? { memberships: { create: { userId: me.id, status: "ACTIVE", role: "MANAGER" } } } : {}),
    },
    select: { id: true, name: true, code: true },
  });
  // On bascule directement sur le nouveau groupe
  await prisma.user.update({ where: { id: me.id }, data: { activeGroupId: group.id } });
  return NextResponse.json(group, { status: 201 });
}
