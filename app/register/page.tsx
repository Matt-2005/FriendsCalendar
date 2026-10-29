import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { googleEnabled } from "@/lib/authOptions";
import RegisterForm from "./RegisterForm";
import { findGroupByCode, normalizeCode } from "@/lib/groups";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const code = normalizeCode((await searchParams).code);
  if (await getMe()) redirect(code ? `/join/${code}` : "/events");
  const group = code ? await findGroupByCode(code) : null;
  return <RegisterForm googleEnabled={googleEnabled} initialCode={group?.code ?? ""} groupName={group?.name} />;
}
