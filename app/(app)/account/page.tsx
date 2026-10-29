import type { Metadata } from "next";
import { isSuperAdmin, requireGroup } from "@/lib/session";
import { getGroupMembers, getMembers, getSwitchableGroups } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/url";
import AccountForm from "./AccountForm";
import CalendarSync from "./CalendarSync";
import PasswordForm from "./PasswordForm";
import LogoutButton from "./LogoutButton";
import GroupAdmin from "./GroupAdmin";
import AllGroups from "./AllGroups";
import DecoToggle from "./DecoToggle";
import { cookies } from "next/headers";
import { currentSeason, DECO_COOKIE } from "@/lib/season";
import NotificationsCard from "../../components/NotificationsCard";

export const metadata: Metadata = { title: "Profil" };

export default async function AccountPage() {
  const { me, group } = await requireGroup();
  const superAdmin = isSuperAdmin(me);
  const season = currentSeason();
  const decoOn = (await cookies()).get(DECO_COOKIE)?.value !== "off";
  const [{ calendarToken, passwordHash }, baseUrl, admin, memberList, allGroups] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: me.id }, select: { calendarToken: true, passwordHash: true } }),
    getBaseUrl(),
    // Liste détaillée et demandes : seulement pour les admins du groupe
    group.canManage ? getGroupMembers(group.id) : Promise.resolve({ members: [], pending: [] }),
    group.canManage ? Promise.resolve([]) : getMembers(group.id),
    superAdmin ? getSwitchableGroups(me) : Promise.resolve([]),
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

      <section className="section" id="groupe">
        <h2 className="section-title">
          <span>👥 {group.name}</span>
          {group.myRole === "MANAGER" && !superAdmin && <span className="badge badge-yes">⭐ Tu es admin</span>}
        </h2>
        <GroupAdmin
          group={group}
          baseUrl={baseUrl}
          members={admin.members}
          pending={admin.pending}
          memberCount={group.canManage ? admin.members.length : memberList.length}
          meId={me.id}
          superAdmin={superAdmin}
        />
      </section>

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

      {season && (
        <section className="section">
          <h2 className="section-title">✨ Ambiance</h2>
          <DecoToggle enabled={decoOn} label={`de ${season.label}`} emoji={season.emoji} />
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

      {superAdmin && !me.simulatedBy && (
        <section className="section" id="groupes">
          <h2 className="section-title">👑 Tous les groupes · {allGroups.length}</h2>
          <AllGroups groups={allGroups} currentId={group.id} />
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
