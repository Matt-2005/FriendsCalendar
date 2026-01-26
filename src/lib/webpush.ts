// src/lib/webpush.ts
import webpush from "web-push";

// Clés VAPID - À REMPLACER avec vos propres clés
// Générer avec: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contact@lesindecis.fr";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  primaryKey?: number;
}

export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushNotificationPayload
) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    
    return { success: true };
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    
    // Si l'abonnement est expiré ou invalide (410 Gone), on retourne une erreur spéciale
    if (error.statusCode === 410) {
      return { success: false, expired: true };
    }
    
    return { success: false, error: error.message };
  }
}

export { webpush };
