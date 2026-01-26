// app/account/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import AccountForm from "./AccountForm";
import Link from "next/link";
import UserMenu from "../components/UserMenu";
import CopyButton from "./CopyButton";
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
              Tous les événements apparaissent automatiquement dans votre calendrier. Seuls les événements que vous refusez sont exclus.
            </p>

            <div className={styles.calendarSection}>
              <div className={styles.subscribeButtons}>
                <a
                  href={webcalUrl}
                  className={styles.subscribeBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={styles.subscribeBtnIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.subscribeBtnContent}>
                    <div className={styles.subscribeBtnTitle}>
                      Apple Calendar / Outlook
                    </div>
                    <div className={styles.subscribeBtnDesc}>
                      Cliquez pour vous abonner instantanément
                    </div>
                  </div>
                  <div className={styles.subscribeBtnArrow}>→</div>
                </a>

                <a
                  href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`}
                  className={styles.subscribeBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className={styles.subscribeBtnIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className={styles.subscribeBtnContent}>
                    <div className={styles.subscribeBtnTitle}>
                      Google Calendar
                    </div>
                    <div className={styles.subscribeBtnDesc}>
                      S'abonner en un clic
                    </div>
                  </div>
                  <div className={styles.subscribeBtnArrow}>→</div>
                </a>
              </div>

              <div className={styles.calendarFeatures}>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Synchronisation automatique</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Tous les événements (sauf refus)</span>
                </div>
                <div className={styles.featureItem}>
                  <span className={styles.featureIcon}>✓</span>
                  <span>Mise à jour en temps réel</span>
                </div>
              </div>

              <details className={styles.advancedOptions}>
                <summary className={styles.advancedSummary}>
                  Options avancées
                </summary>
                <div className={styles.advancedContent}>
                  <div className={styles.urlSection}>
                    <label className={styles.urlLabel}>URL du calendrier (iCal)</label>
                    <div className={styles.urlBox}>
                      <code className={styles.urlCode}>{httpsUrl}</code>
                      <CopyButton url={httpsUrl} />
                    </div>
                  </div>

                  <form action="/api/account/regenerate-calendar-token" method="post">
                    <button type="submit" className={styles.regenerateButton}>
                      🔄 Régénérer le lien (invalide l'ancien)
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
