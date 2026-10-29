import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMe, getRealMeId, isSuperAdmin } from "@/lib/session";
import { findGroupByCode, groupManagerIds, removeMembership } from "@/lib/groups";
import { sendPush } from "@/lib/push";
import { clientIp, rateLimit, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Demander à rejoindre un groupe avec son code
export async function POST(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  // Empêche de deviner les codes en essayant au hasard
  const limit = rateLimit(`join:${await getRealMeId()}:${await clientIp()}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSec);

  const body = await req.json().catch(() => null);
  const group = await findGroupByCode(body?.code);
  if (!group) return NextResponse.json({ error: "Ce code ne correspond à aucun groupe. Vérifie-le auprès de l'organisateur." }, { status: 404 });

  const existing = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: me.id, groupId: group.id } },
    select: { status: true },
  });
  if (existing?.status === "ACTIVE") {
    await prisma.user.update({ where: { id: me.id }, data: { activeGroupId: group.id } });
    return NextResponse.json({ status: "ACTIVE", group: { name: group.name } });
  }
  if (existing) return NextResponse.json({ status: "PENDING", group: { name: group.name } });

  // Le super admin entre directement ; les autres attendent la validation d'un admin du groupe
  const status = isSuperAdmin(me) ? "ACTIVE" : "PENDING";
  await prisma.membership.create({ data: { userId: me.id, groupId: group.id, status } });
  if (status === "ACTIVE") {
    await prisma.user.update({ where: { id: me.id }, data: { activeGroupId: group.id } });
  } else {
    after(async () =>
      sendPush(await groupManagerIds(group.id), {
        title: `👋 ${me.pseudo} veut rejoindre ${group.name}`,
        body: "Touche pour accepter ou refuser sa demande.",
        url: "/account#groupe",
        tag: `join-${group.id}-${me.id}`,
      })
    );
  }
  return NextResponse.json({ status, group: { name: group.name } }, { status: 201 });
}

// Annuler sa demande, ou quitter un groupe
export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const groupId = Number(new URL(req.url).searchParams.get("groupId"));
  if (!Number.isInteger(groupId)) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  await removeMembership(me.id, groupId);
  return NextResponse.json({ ok: true });
}
