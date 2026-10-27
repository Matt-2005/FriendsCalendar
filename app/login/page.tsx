import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { googleEnabled } from "@/lib/authOptions";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

function safeCallback(url?: string) {
  // On n'autorise que les adresses internes au site
  return url && url.startsWith("/") && !url.startsWith("//") ? url : "/events";
}

const ERRORS: Record<string, string> = {
  AccessDenied: "Connexion Google refusée. Vérifie que ton adresse Gmail est bien confirmée.",
  OAuthCallback: "La connexion Google n'a pas abouti, réessaie.",
  OAuthSignin: "Impossible de joindre Google, réessaie dans un instant.",
  Callback: "La connexion n'a pas abouti, réessaie.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; email?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallback(params.callbackUrl);
  if (await getMe()) redirect(callbackUrl);
  const error = params.error && params.error !== "CredentialsSignin" ? ERRORS[params.error] ?? "La connexion a échoué, réessaie." : null;
  return <LoginForm callbackUrl={callbackUrl} initialEmail={params.email ?? ""} googleEnabled={googleEnabled} initialError={error} />;
}
