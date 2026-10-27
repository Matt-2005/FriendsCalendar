import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import { googleEnabled } from "@/lib/authOptions";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Inscription" };

export default async function RegisterPage() {
  if (await getMe()) redirect("/events");
  return <RegisterForm googleEnabled={googleEnabled} />;
}
