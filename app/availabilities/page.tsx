// app/availabilities/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import UserMenu from "../components/UserMenu";
import AvailabilityManager from "./AvailabilityManager";
import styles from "./availabilities.module.css";

export default async function AvailabilitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const userId = Number(session.user.id);

  // Récupérer toutes les disponibilités
  const availabilities = await prisma.availability.findMany({
    include: {
      user: {
        select: { id: true, pseudo: true, avatarUrl: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const myAvailabilities = availabilities.filter((a) => a.userId === userId);
  const othersAvailabilities = availabilities.filter((a) => a.userId !== userId);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/events" className={styles.backLink}>
              ← Retour aux événements
            </Link>
            <h1 className={styles.pageTitle}>Disponibilités</h1>
            <p className={styles.pageSubtitle}>
              Indiquez vos disponibilités et consultez celles de vos amis
            </p>
          </div>
          <UserMenu />
        </div>

        <div className={styles.content}>
          {/* Mes disponibilités */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Mes disponibilités</h2>
            <p className={styles.sectionDesc}>
              Ajoutez vos périodes de disponibilité, vos vacances ou vos périodes d'indisponibilité
            </p>
            <AvailabilityManager
              initialAvailabilities={myAvailabilities}
              userId={userId}
            />
          </div>

          {/* Disponibilités des autres */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Disponibilités de vos amis ({othersAvailabilities.length})
            </h2>
            <p className={styles.sectionDesc}>
              Consultez les disponibilités de vos amis pour planifier au mieux vos événements
            </p>
            
            {othersAvailabilities.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyIcon}>📅</p>
                <p className={styles.emptyText}>
                  Aucune disponibilité partagée pour le moment
                </p>
              </div>
            ) : (
              <div className={styles.availabilitiesList}>
                {othersAvailabilities.map((avail) => (
                  <div key={avail.id} className={styles.availabilityCard}>
                    <div className={styles.userInfo}>
                      {avail.user.avatarUrl ? (
                        <img
                          src={avail.user.avatarUrl}
                          alt={avail.user.pseudo}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {avail.user.pseudo[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <span className={styles.userName}>{avail.user.pseudo}</span>
                    </div>
                    
                    <div className={styles.availabilityInfo}>
                      <div className={`${styles.typeBadge} ${styles[`type${avail.type}`]}`}>
                        {avail.type === "AVAILABLE" && "✅ Disponible"}
                        {avail.type === "VACATION" && "🏖️ Vacances"}
                        {avail.type === "BUSY" && "🚫 Occupé"}
                      </div>
                      
                      <div className={styles.dates}>
                        Du {new Date(avail.startDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        au {new Date(avail.endDate).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                      
                      {avail.note && (
                        <p className={styles.note}>💬 {avail.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
