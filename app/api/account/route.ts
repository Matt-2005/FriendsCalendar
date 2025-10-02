// app/api/account/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
export const runtime = "nodejs";


export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userIdStr = session?.user?.id;
  if (!userIdStr) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const pseudo = String(body?.pseudo ?? "").trim();
  const currentPassword = body?.currentPassword ? String(body.currentPassword) : undefined;
  const newPassword = body?.newPassword ? String(body.newPassword) : undefined;

  if (!email || !email.includes("@") || !pseudo) {
    return NextResponse.json({ error: "Entrées invalides" }, { status: 400 });
  }

  const data: any = { email, pseudo };

  // Changement de mot de passe (optionnel)
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Nouveau mot de passe trop court" }, { status: 400 });

    const me = await prisma.user.findUnique({ where: { id: Number(userIdStr) }, select: { passwordHash: true } });
    if (!me?.passwordHash) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, me.passwordHash);
    if (!ok) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({
    where: { id: Number(userIdStr) },
    data,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
