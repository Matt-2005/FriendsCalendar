// app/api/account/profile/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const { email, pseudo } = body;

    // Validation basique
    if (!email || !pseudo) {
      return NextResponse.json({ error: "Email et pseudo requis" }, { status: 400 });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
      }
    }

    // Mettre à jour le profil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: email,
        pseudo: pseudo
      }
    });

    console.log("Profil mis à jour:", { userId, email, pseudo });

    return NextResponse.json({ 
      ok: true, 
      user: {
        email: updatedUser.email,
        pseudo: updatedUser.pseudo
      }
    });

  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la mise à jour du profil",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
