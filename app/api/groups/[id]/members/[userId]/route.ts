import { NextResponse, after, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageGroup, getMe, isSuperAdmin } from "@/lib/session";
import { sendPush } from "@/lib/push";
import { removeMembership } from "@/lib/groups";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; userId: string }> };

async function load(ctx: Ctx) {
  const me = await getMe();
  if (!me) return { error: NextResponse.json({ error: "Non connecté" }, { status: 401 }) };
  const p = await ctx.params;
  const groupId = Number(p.id);
  const userId = Number(p.userId);
  if (!Number.isInteger(groupId) || !Number.isInteger(userId) || !canManageGroup(me, groupId)) {
    return { error: NextResponse.json({ error: "Réservé aux admins du groupe" }, { status: 403 }) };
  }
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: { user: { select: { role: true } }, group: { select: { name: true } } },
  });
  if (!membership) return { error: NextResponse.json({ error: "Cette personne n'est pas dans le groupe" }, { status: 404 }) };
  return { me, membership, groupId, userId };
}

/**
 * { action: "accept" }  : accepter une demande (admins du groupe)
 * { action: "promote" } : nommer admin du groupe (super admin)
 * { action: "demote" }  : retirer le rôle d'admin du groupe (super admin)
 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const res = await load(ctx);
  if (res.error) return res.error;
  const { me, membership, groupId, userId } = res;
  const action = (await req.json().catch(() => null))?.action;
  const where = { userId_groupId: { userId, groupId } };

  if (action === "accept") {
    if (membership.status === "ACTIVE") return NextResponse.json({ ok: true });
    await prisma.membership.update({ where, data: { status: "ACTIVE" } });
    // Son appli s'ouvre directement sur ce groupe
    await prisma.user.update({ where: { id: userId }, data: { activeGroupId: groupId } });
    after(() =>
      sendPush([userId], {
        title: `🎉 Bienvenue dans ${membership.group.name} !`,
        body: "Ta demande est acceptée. Viens voir les sorties prévues.",
        url: "/events",
        tag: `join-${groupId}-${userId}`,
      })
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "promote" || action === "demote") {
    if (!isSuperAdmin(me)) return NextResponse.json({ error: "Seul le super admin peut nommer les admins" }, { status: 403 });
    if (membership.status !== "ACTIVE") return NextResponse.json({ error: "Accepte d'abord sa demande" }, { status: 400 });
    await prisma.membership.update({ where, data: { role: action === "promote" ? "MANAGER" : "MEMBER" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}

// Refuser une demande ou retirer quelqu'un du groupe
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const res = await load(ctx);
  if (res.error) return res.error;
  const { me, membership, groupId, userId } = res;
  if (userId === me.id) return NextResponse.json({ error: "Pour partir, utilise « Quitter le groupe »" }, { status: 400 });
  // Un admin de groupe ne peut pas retirer un autre admin, ni le super admin
  if (!isSuperAdmin(me) && (membership.role === "MANAGER" || membership.user.role === "ADMIN")) {
    return NextResponse.json({ error: "Seul le super admin peut retirer un admin" }, { status: 403 });
  }
  await removeMembership(userId, groupId);
  return NextResponse.json({ ok: true });
}
