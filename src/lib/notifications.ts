// src/lib/notifications.ts
import { prisma } from "./prisma";
import { sendPushNotification } from "./webpush";

export async function notifyEventCreated(eventId: number, creatorId: number) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { creator: { select: { pseudo: true } } },
    });

    if (!event) return;

    // Récupérer tous les utilisateurs sauf le créateur
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { not: creatorId },
      },
    });

    const payload = {
      title: "📅 Nouvel événement créé",
      body: `${event.creator.pseudo} a créé "${event.title}"`,
      url: "/events",
      primaryKey: eventId,
    };

    // Envoyer les notifications à tous les utilisateurs
    await sendNotificationsToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error("Error notifying event created:", error);
  }
}

export async function notifyEventUpdated(eventId: number) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { select: { pseudo: true } },
        rsvps: { select: { userID: true } },
      },
    });

    if (!event) return;

    // Notifier tous les participants (ceux qui ont un RSVP)
    const participantIds = event.rsvps.map((r) => r.userID);

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: participantIds },
      },
    });

    const payload = {
      title: "✏️ Événement modifié",
      body: `"${event.title}" a été modifié`,
      url: "/events",
      primaryKey: eventId,
    };

    await sendNotificationsToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error("Error notifying event updated:", error);
  }
}

export async function notifyEventDeleted(eventTitle: string, participantIds: number[]) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: participantIds },
      },
    });

    const payload = {
      title: "🗑️ Événement supprimé",
      body: `L'événement "${eventTitle}" a été supprimé`,
      url: "/events",
    };

    await sendNotificationsToSubscriptions(subscriptions, payload);
  } catch (error) {
    console.error("Error notifying event deleted:", error);
  }
}

async function sendNotificationsToSubscriptions(
  subscriptions: Array<{ id: number; endpoint: string; p256dh: string; auth: string }>,
  payload: any
) {
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload
      );

      // Si l'abonnement est expiré, le supprimer de la base de données
      if (!result.success && result.expired) {
        await prisma.pushSubscription.delete({
          where: { id: sub.id },
        });
      }

      return result;
    })
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`Notifications sent: ${successful} successful, ${failed} failed`);
}
