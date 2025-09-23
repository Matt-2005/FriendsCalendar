// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt"; // ou `bcrypt` + @types/bcrypt

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const pseudo = String(body?.pseudo ?? "").trim();

    // Validation minimale
    if (!email || !email.includes("@") || password.length < 6 || !pseudo) {
      return NextResponse.json({ error: "Entrées invalides" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Laisse la BDD arbitrer l’unicité (évite la course)
    await prisma.user.create({
      data: { email, passwordHash, pseudo },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    // Contrainte unique (email)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    console.error("REGISTER_API_ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
