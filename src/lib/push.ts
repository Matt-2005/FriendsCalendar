import "server-only";
import webpush from "web-push";
import { prisma } from "./prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "https://calendar.matthewle.fr";

export const pushEnabled = Boolean(publicKey && privateKey);

if (pushEnabled) {
  webpush.setVapidDetails(subject.includes(":") ? subject : `mailto:${subject}`, publicKey!, privateKey!);
}

/** Envoie une notification à tous les appareils des utilisateurs donnés. N'échoue jamais. */
export async function sendPush(userIds: number[], payload: PushPayload) {
  if (!pushEnabled || userIds.length === 0) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
    const expired: number[] = [];
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 24 }
          );
        } catch (e) {
          const err = e as { statusCode?: number; body?: string; message?: string };
          // 404/410 : l'abonnement n'existe plus (appli désinstallée, notifs coupées)
          if (err?.statusCode === 404 || err?.statusCode === 410) expired.push(s.id);
          else console.error("Push error:", err?.statusCode, err?.body ?? err?.message);
        }
      })
    );
    if (expired.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  } catch (err) {
    console.error("sendPush failed:", err);
  }
}

/** Tous les membres sauf ceux exclus. */
export async function allUserIdsExcept(...exclude: number[]) {
  const users = await prisma.user.findMany({ select: { id: true } });
  return users.map((u) => u.id).filter((id) => !exclude.includes(id));
}
