import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import AccountForm from "./AccountForm";
import CalendarSync from "./CalendarSync";
import PasswordForm from "./PasswordForm";
import LogoutButton from "./LogoutButton";
import MembersAdmin from "./MembersAdmin";
import NotificationsCard from "../../components/NotificationsCard";

export const metadata: Metadata = { title: "Profil" };

export default async function AccountPage() {
  const me = await requireMe();
  const [{ calendarToken, passwordHash }, baseUrl, members] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { calendarToken: true, passwordHash: true } }),
    getBaseUrl(),
    me.role === "ADMIN"
      ? prisma.user.findMany({ select: { id: true, pseudo: true, email: true, avatarUrl: true }, orderBy: { pseudo: "asc" } })
      : Promise.resolve([]),
  ]);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">Profil</h1>
      </header>

      {me.simulatedBy && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          👀 Tu modifies le profil de {me.pseudo}. Les notifications et le mot de passe restent ceux de ton téléphone : ils sont masqués ici.
        </div>
      )}

      <AccountForm
        initialEmail={me.email}
        initialPseudo={me.pseudo}
        initialAvatarUrl={me.avatarUrl ?? ""}
        simulating={Boolean(me.simulatedBy)}
      />

      {!me.simulatedBy && (
      <section className="section">
        <h2 className="section-title">🔔 Notifications</h2>
        <div className="card">
          <p className="card-text" style={{ marginBottom: 12 }}>
            Sois prévenu quand un pote propose une sortie, quand elle change, et le jour J.
          </p>
          <NotificationsCard variant="settings" />
        </div>
      </section>
      )}

      <section className="section" id="agenda">
        <h2 className="section-title">📅 Mon agenda de téléphone</h2>
        <CalendarSync baseUrl={baseUrl} initialToken={calendarToken} />
      </section>

      {!me.simulatedBy && (
        <section className="section">
          <h2 className="section-title">🔒 Sécurité</h2>
          <PasswordForm hasPassword={Boolean(passwordHash)} />
        </section>
      )}

      {me.role === "ADMIN" && (
        <section className="section">
          <h2 className="section-title">👑 Membres du groupe · {members.length}</h2>
          <MembersAdmin members={members} meId={me.id} />
        </section>
      )}

      {!me.simulatedBy && (
        <section className="section">
          <LogoutButton />
        </section>
      )}
    </main>
  );
}
