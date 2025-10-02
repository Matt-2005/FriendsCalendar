// app/api/account/regenerate-calendar-token/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { genCalendarToken } from "@/lib/token";

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const newToken = genCalendarToken();
  await prisma.user.update({ where: { id: userId }, data: { calendarToken: newToken } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
