// app/account/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent("/account")}`);

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { email: true, pseudo: true, avatarUrl: true },
  });
  if (!user) redirect("/login");

  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>Mon compte</h1>
      <AccountForm initial={{ ...user }} />
    </div>
  );
}
