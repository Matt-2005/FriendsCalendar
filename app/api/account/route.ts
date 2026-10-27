import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMeId } from "@/lib/session";
import bcrypt from "bcrypt";
import { passwordProblem } from "@/lib/password";
import { rateLimit, tooMany } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Changement de mot de passe
export async function PATCH(req: Request) {
  const meId = await getMeId();
  if (!meId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  const pwError = passwordProblem(newPassword);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  const limit = rateLimit(`password:${meId}`, 10, 15 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSec);

  const me = await prisma.user.findUnique({ where: { id: meId }, select: { passwordHash: true } });
  if (!me) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Compte créé avec Google (sans mot de passe) : on peut en définir un directement
  if (me.passwordHash && !(await bcrypt.compare(currentPassword, me.passwordHash))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: meId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
}
