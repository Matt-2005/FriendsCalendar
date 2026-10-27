import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { genCalendarToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const pseudo = String(body?.pseudo ?? "").trim().slice(0, 40);

  if (!pseudo) return NextResponse.json({ error: "Indique ton prénom ou ton pseudo" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 6 caractères" }, { status: 400 });
  }

  const exists = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email. Connecte-toi !" }, { status: 409 });
  }

  try {
    await prisma.user.create({
      data: { email, pseudo, passwordHash: await bcrypt.hash(password, 12), calendarToken: genCalendarToken() },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("REGISTER_API_ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur, réessaie" }, { status: 500 });
  }
}
