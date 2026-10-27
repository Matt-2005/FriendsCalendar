import { headers } from "next/headers";

/** URL publique du site (ex. https://calendar.matthewle.fr), sans slash final. */
export async function getBaseUrl() {
  const env = process.env.NEXTAUTH_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "calendar.matthewle.fr";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
