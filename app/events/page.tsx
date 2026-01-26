// app/events/page.tsx — Server Component
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import RsvpButtons from "./RsvpButtons";
import DeleteEventButton from "./DeleteEventButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Calendar from "./calendar";
import Link from "next/link";
import UserMenu from "../components/UserMenu";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  const events = await prisma.event.findMany({
    select: {
      id: true, title: true, date: true, location: true, description: true,
      creatorId: true,
      rsvps: {
        select: { 
          status: true,
          user: { select: { id: true, pseudo: true, avatarUrl: true } }
        },
      },
    },
    orderBy: { date: "asc" },
    take: 100,
  });

  // Récupérer toutes les disponibilités pour afficher dans le calendrier
  let availabilities: any[] = [];
  try {
    availabilities = await prisma.availability.findMany({
      include: {
        user: {
          select: { id: true, pseudo: true, avatarUrl: true },
        },
      },
      orderBy: { startDate: "asc" },
    });
  } catch (error) {
    // La table Availability n'existe pas encore (migration non exécutée)
    console.log("Availability table not found, skipping availabilities");
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Mes Événements</h1>
            <p className={styles.pageSubtitle}>
              Organisez et participez aux événements avec vos amis
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/events/new" className={styles.createButton}>
              <span className={styles.createIcon}>+</span>
              Créer un événement
            </Link>
            <UserMenu />
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.leftPanel}>
            <Calendar events={events} availabilities={availabilities} />
          </div>

          <div className={styles.rightPanel}>
            <div className={styles.eventsHeader}>
              <h2>Événements à venir</h2>
              <span className={styles.eventCount}>{events.length}</span>
            </div>

            <div className={styles.eventsList}>
              {events.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <p className={styles.emptyTitle}>Aucun événement</p>
                  <p className={styles.emptyText}>
                    Créez votre premier événement pour commencer
                  </p>
                  <Link href="/events/new" className={styles.emptyButton}>
                    Créer un événement
                  </Link>
                </div>
              ) : (
                events.map((e) => {
                  const yesRsvps = e.rsvps.filter(r => r.status === "YES");
                  const noRsvps = e.rsvps.filter(r => r.status === "NO");
                  const participants = yesRsvps.map(r => r.user);
                  const notParticipating = noRsvps.map(r => r.user);
                  
                  return (
                    <div key={e.id} className={styles.eventCard}>
                      {meId === e.creatorId && (
                        <div className={styles.eventDeleteSlot}>
                          <DeleteEventButton eventId={e.id} />
                        </div>
                      )}

                      <div className={styles.eventCardHeader}>
                        <div className={styles.eventDate}>
                          <div className={styles.eventDay}>
                            {new Date(e.date).getDate()}
                          </div>
                          <div className={styles.eventMonth}>
                            {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(e.date))}
                          </div>
                        </div>

                        <div className={styles.eventInfo}>
                          <h3 className={styles.eventTitle}>{e.title}</h3>
                          <div className={styles.eventMeta}>
                            <span className={styles.eventTime}>
                              🕐 {fmtTime(e.date)}
                            </span>
                            {e.location && (
                              <span className={styles.eventLocation}>
                                📍 {e.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {e.description && (
                        <p className={styles.eventDesc}>{e.description}</p>
                      )}

                      {/* Participants YES */}
                      <div className={styles.eventParticipants}>
                        <div className={styles.participantsLabel}>
                          ✓ Participants ({participants.length})
                        </div>
                        {participants.length === 0 ? (
                          <span className={styles.emptyParticipants}>
                            Aucun participant pour l'instant
                          </span>
                        ) : (
                          <div className={styles.avatarsRow}>
                            {participants.slice(0, 5).map((u) => (
                              <div
                                key={u.id}
                                className={styles.participantAvatar}
                                title={u.pseudo ?? ""}
                              >
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt={u.pseudo ?? "avatar"}
                                  />
                                ) : (
                                  <span className={styles.avatarPlaceholder}>
                                    {u.pseudo?.[0]?.toUpperCase() ?? "?"}
                                  </span>
                                )}
                              </div>
                            ))}
                            {participants.length > 5 && (
                              <div className={styles.participantAvatar}>
                                <span className={styles.avatarPlaceholder}>
                                  +{participants.length - 5}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Participants NO */}
                      {notParticipating.length > 0 && (
                        <div className={styles.eventParticipants}>
                          <div className={styles.notParticipantsLabel}>
                            ✗ Ne participent pas ({notParticipating.length})
                          </div>
                          <div className={styles.avatarsRow}>
                            {notParticipating.slice(0, 5).map((u) => (
                              <div
                                key={u.id}
                                className={`${styles.participantAvatar} ${styles.notParticipatingAvatar}`}
                                title={u.pseudo ?? ""}
                              >
                                {u.avatarUrl ? (
                                  <img
                                    src={u.avatarUrl}
                                    alt={u.pseudo ?? "avatar"}
                                  />
                                ) : (
                                  <span className={styles.avatarPlaceholder}>
                                    {u.pseudo?.[0]?.toUpperCase() ?? "?"}
                                  </span>
                                )}
                              </div>
                            ))}
                            {notParticipating.length > 5 && (
                              <div className={`${styles.participantAvatar} ${styles.notParticipatingAvatar}`}>
                                <span className={styles.avatarPlaceholder}>
                                  +{notParticipating.length - 5}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className={styles.eventActions}>
                        <RsvpButtons eventId={e.id} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
