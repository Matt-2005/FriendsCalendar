// app/api/availabilities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// DELETE - Supprimer une disponibilité
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const availabilityId = Number(id);

    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      select: { userId: true },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Disponibilité introuvable" },
        { status: 404 }
      );
    }

    if (availability.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    await prisma.availability.delete({
      where: { id: availabilityId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier une disponibilité
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const availabilityId = Number(id);
    const body = await req.json();
    const { startDate, endDate, type, note } = body;

    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
      select: { userId: true },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Disponibilité introuvable" },
        { status: 404 }
      );
    }

    if (availability.userId !== userId) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (type) updateData.type = type;
    if (note !== undefined) updateData.note = note || null;

    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return NextResponse.json(
          { error: "La date de fin doit être après la date de début" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    );
  }
}
