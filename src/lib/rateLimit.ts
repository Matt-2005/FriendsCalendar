import "server-only";
import { headers } from "next/headers";

/**
 * Limiteur de tentatives en mémoire (fenêtre glissante).
 * Sur Vercel chaque instance a sa propre mémoire : c'est une protection "de base"
 * contre les rafales (devinette de mot de passe, spam), pas une garantie absolue.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Ménage pour ne pas grossir indéfiniment
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Adresse IP du visiteur (derrière le proxy Vercel) */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export function tooMany(retryAfterSec: number) {
  return Response.json(
    { error: "Trop de tentatives, réessaie dans quelques minutes" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
