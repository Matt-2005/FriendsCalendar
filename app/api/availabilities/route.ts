import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Récupérer toutes les disponibilités
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const availabilities = await prisma.availability.findMany({
      include: {
        user: {
          select: { id: true, pseudo: true, avatarUrl: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Error fetching availabilities:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle disponibilité
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { startDate, endDate, type, note } = body;

    // Validation
    if (!startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "startDate, endDate et type sont requis" },
        { status: 400 }
      );
    }

    // Valider les dates (ne pas modifier les heures, elles sont déjà normalisées par le client)
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Format de date invalide" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "La date de début doit être avant la date de fin" },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        userId: Number(session.user.id),
        startDate: start,
        endDate: end,
        type,
        note: note || null,
      },
      include: {
        user: {
          select: { id: true, pseudo: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
      { status: 500 }
    );
  }
}
