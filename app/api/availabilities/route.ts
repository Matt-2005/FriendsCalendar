// app/api/availabilities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - Récupérer toutes les disponibilités (de tous les utilisateurs)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    
    if (startDate && endDate) {
      where.OR = [
        {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          endDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { endDate: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    const availabilities = await prisma.availability.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(availabilities);
  } catch (error: any) {
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

    const userId = Number(session.user.id);
    const body = await req.json();
    const { startDate, endDate, type, note } = body;

    if (!startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        userId,
        startDate: start,
        endDate: end,
        type,
        note: note || null,
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error: any) {
    console.error("Error creating availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
      { status: 500 }
    );
  }
}
