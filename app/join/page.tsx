import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGroup, requireMe } from "@/lib/session";
import JoinScreen from "./JoinScreen";

export const metadata: Metadata = { title: "Rejoindre un groupe" };

export default async function JoinPage() {
  const me = await requireMe("/join");
  const [pending, group] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: me.id, status: "PENDING" },
      select: { groupId: true, group: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getGroup(),
  ]);
  return (
    <JoinScreen
      pseudo={me.pseudo}
      hasGroup={Boolean(group)}
      pending={pending.map((p) => ({ groupId: p.groupId, name: p.group.name }))}
    />
  );
}
