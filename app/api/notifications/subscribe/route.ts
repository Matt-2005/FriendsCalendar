// app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Données de subscription invalides" },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour la subscription
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint,
        },
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error subscribing to push notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription aux notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint manquant" },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unsubscribing from push notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription" },
      { status: 500 }
    );
  }
}
