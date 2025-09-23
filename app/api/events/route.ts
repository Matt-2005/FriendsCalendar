// app/api/events/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number((session.user as any).id) : null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const location = String(body?.location ?? "").trim();
  const dateStr = String(body?.date ?? ""); // ISO string

  const date = new Date(dateStr);
  if (!title || !description || !location || isNaN(date.getTime())) {
    return NextResponse.json({ error: "Entrées invalides" }, { status: 400 });
  }

  await prisma.event.create({
    data: {
      title,
      description,
      location,
      date,
      creatorId: userId,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
