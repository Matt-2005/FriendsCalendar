import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageGroup, getMe, isSuperAdmin } from "@/lib/session";
import { GROUP_NAME_MAX, uniqueGroupCode } from "@/lib/groups";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * { name } : renommer (super admin)
 * { newCode: true } : nouveau code d'invitation, l'ancien ne marche plus (admins du groupe)
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const groupId = Number((await ctx.params).id);
  if (!Number.isInteger(groupId) || !canManageGroup(me, groupId)) {
    return NextResponse.json({ error: "Réservé aux admins du groupe" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const data: { name?: string; code?: string } = {};

  if (body?.name !== undefined) {
    if (!isSuperAdmin(me)) return NextResponse.json({ error: "Seul le super admin peut renommer un groupe" }, { status: 403 });
    const name = String(body.name).trim().slice(0, GROUP_NAME_MAX);
    if (!name) return NextResponse.json({ error: "Donne un nom au groupe" }, { status: 400 });
    data.name = name;
  }
  if (body?.newCode) data.code = await uniqueGroupCode();
  if (!data.name && !data.code) return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });

  const group = await prisma.group.update({ where: { id: groupId }, data, select: { id: true, name: true, code: true } });
  return NextResponse.json(group);
}
