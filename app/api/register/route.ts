// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { genCalendarToken } from "@/lib/token";

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

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        pseudo,
        calendarToken: genCalendarToken(), // ⬅️ depuis lib/token
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta as any)?.target as string[] | undefined;
      if (target?.includes?.("email")) {
        return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
      }
      if (target?.includes?.("calendarToken")) {
        return NextResponse.json({ error: "Conflit de token, réessayez" }, { status: 500 });
      }
    }
    console.error("REGISTER_API_ERROR:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
