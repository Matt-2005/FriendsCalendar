import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE - Supprimer une disponibilité
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const availabilityId = parseInt(id);
    if (isNaN(availabilityId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que la disponibilité appartient à l'utilisateur
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Disponibilité non trouvée" },
        { status: 404 }
      );
    }

    if (availability.userId !== Number(session.user.id)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.availability.delete({
      where: { id: availabilityId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const availabilityId = parseInt(id);
    if (isNaN(availabilityId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { startDate, endDate, type, note } = body;

    // Vérifier que la disponibilité appartient à l'utilisateur
    const availability = await prisma.availability.findUnique({
      where: { id: availabilityId },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Disponibilité non trouvée" },
        { status: 404 }
      );
    }

    if (availability.userId !== Number(session.user.id)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "Format de date de début invalide" },
          { status: 400 }
        );
      }
      updateData.startDate = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Format de date de fin invalide" },
          { status: 400 }
        );
      }
      updateData.endDate = end;
    }

    if (type) updateData.type = type;
    if (note !== undefined) updateData.note = note || null;

    const updated = await prisma.availability.update({
      where: { id: availabilityId },
      data: updateData,
      include: {
        user: {
          select: { id: true, pseudo: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    );
  }
}
