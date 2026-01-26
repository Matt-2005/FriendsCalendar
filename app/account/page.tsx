// app/account/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import AccountForm from "./AccountForm";
import Link from "next/link";
import UserMenu from "../components/UserMenu";
import styles from "./account.module.css";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, pseudo: true, avatarUrl: true, calendarToken: true },
  });
  if (!user) return null;

  const httpsUrl = `https://lesindeciscalendar.fr/api/ical/${user.calendarToken}.ics`;
  const webcalUrl = `webcal://lesindeciscalendar.fr/api/ical/${user.calendarToken}.ics`;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Link href="/events" className={styles.backLink}>
              ← Retour aux événements
            </Link>
            <h1 className={styles.pageTitle}>Mon Compte</h1>
            <p className={styles.pageSubtitle}>
              Gérez vos informations personnelles et vos préférences
            </p>
          </div>
          <UserMenu />
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Informations personnelles</h2>
            <p className={styles.cardSubtitle}>
              Mettez à jour votre profil et votre photo
            </p>
            <AccountForm
              initialEmail={user.email}
              initialPseudo={user.pseudo}
              initialAvatarUrl={user.avatarUrl ?? ""}
            />
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Abonnement au calendrier</h2>
            <p className={styles.cardSubtitle}>
              Synchronisez vos événements avec votre application de calendrier préférée
            </p>

            <div className={styles.calendarSection}>
              <div className={styles.calendarInfo}>
                <div className={styles.calendarIcon}>🍎</div>
                <div className={styles.calendarText}>
                  <h4>Apple Calendar & Outlook</h4>
                  <p>Cliquez sur le lien pour vous abonner automatiquement</p>
                  <a href={webcalUrl} className={styles.calendarUrl}>
                    {webcalUrl}
                  </a>
                </div>
              </div>

              <div className={styles.calendarInfo}>
                <div className={styles.calendarIcon}>📅</div>
                <div className={styles.calendarText}>
                  <h4>Google Calendar</h4>
                  <p>
                    Allez dans "Autres agendas" → "S'abonner à un agenda" → Collez l'URL ci-dessous
                  </p>
                  <code className={styles.calendarUrl}>{httpsUrl}</code>
                </div>
              </div>

              <form action="/api/account/regenerate-calendar-token" method="post">
                <button type="submit" className={styles.regenerateButton}>
                  🔄 Régénérer le lien (invalide l'ancien)
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
