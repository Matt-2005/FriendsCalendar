// app/my-events/page.tsx
import { prisma } from "@/lib/prisma";
import styles from "./myevents.module.css";
import DeleteEventButton from "../events/DeleteEventButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Link from "next/link";
import UserMenu from "../components/UserMenu";
import { cleanupPastEvents } from "@/lib/cleanupEvents";

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  if (!meId) {
    return null;
  }

  // Nettoyer les événements passés avant d'afficher la page
  await cleanupPastEvents();

  const myEvents = await prisma.event.findMany({
    where: {
      creatorId: meId,
    },
    select: {
      id: true,
      title: true,
      date: true,
      location: true,
      description: true,
      creatorId: true,
      rsvps: {
        select: { 
          status: true,
          user: { select: { id: true, pseudo: true, avatarUrl: true } }
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <Link href="/events" className={styles.backLink}>
              ← Tous les événements
            </Link>
            <h1 className={styles.pageTitle}>Mes événements créés</h1>
            <p className={styles.pageSubtitle}>
              Gérez les événements que vous avez organisés
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

        <div className={styles.content}>
          {myEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <p className={styles.emptyTitle}>Aucun événement créé</p>
              <p className={styles.emptyText}>
                Vous n'avez pas encore créé d'événement. Commencez maintenant !
              </p>
              <Link href="/events/new" className={styles.emptyButton}>
                Créer mon premier événement
              </Link>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {myEvents.map((e) => {
                const yesRsvps = e.rsvps.filter(r => r.status === "YES");
                const noRsvps = e.rsvps.filter(r => r.status === "NO");
                const participants = yesRsvps.map((r) => r.user);
                const notParticipating = noRsvps.map((r) => r.user);
                const eventDate = new Date(e.date);
                const isPast = eventDate < new Date();

                return (
                  <div
                    key={e.id}
                    className={`${styles.eventCard} ${
                      isPast ? styles.eventCardPast : ""
                    }`}
                  >
                    <div className={styles.eventCardHeader}>
                      <div
                        className={`${styles.eventDate} ${
                          isPast ? styles.eventDatePast : ""
                        }`}
                      >
                        <div className={styles.eventDay}>
                          {eventDate.getDate()}
                        </div>
                        <div className={styles.eventMonth}>
                          {new Intl.DateTimeFormat("fr-FR", {
                            month: "short",
                          }).format(eventDate)}
                        </div>
                      </div>

                      <div className={styles.eventInfo}>
                        <div className={styles.eventStatus}>
                          {isPast ? (
                            <span className={styles.statusPast}>Passé</span>
                          ) : (
                            <span className={styles.statusUpcoming}>
                              À venir
                            </span>
                          )}
                        </div>
                        <h3 className={styles.eventTitle}>{e.title}</h3>
                        <div className={styles.eventMeta}>
                          <span className={styles.eventTime}>
                            🕐 {fmtTime(eventDate)}
                          </span>
                          {e.location && (
                            <span className={styles.eventLocation}>
                              📍 {e.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.eventDeleteSlot}>
                        <DeleteEventButton eventId={e.id} />
                      </div>
                    </div>

                    {e.description && (
                      <p className={styles.eventDesc}>{e.description}</p>
                    )}

                    <div className={styles.eventParticipants}>
                      <div className={styles.participantsHeader}>
                        <span className={styles.participantsLabel}>
                          ✓ Participants
                        </span>
                        <span className={styles.participantsCount}>
                          {participants.length}
                        </span>
                      </div>
                      {participants.length === 0 ? (
                        <span className={styles.emptyParticipants}>
                          Aucun participant pour l'instant
                        </span>
                      ) : (
                        <div className={styles.avatarsRow}>
                          {participants.slice(0, 8).map((u) => (
                            <div
                              key={u.id}
                              className={styles.participantAvatar}
                              data-tooltip={u.pseudo ?? ""}
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
                              <span className={styles.avatarTooltip}>{u.pseudo}</span>
                            </div>
                          ))}
                          {participants.length > 8 && (
                            <div className={styles.participantAvatar}>
                              <span className={styles.avatarPlaceholder}>
                                +{participants.length - 8}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {notParticipating.length > 0 && (
                      <div className={styles.eventParticipants}>
                        <div className={styles.participantsHeader}>
                          <span className={styles.notParticipantsLabel}>
                            ✗ Ne participent pas
                          </span>
                          <span className={styles.participantsCount}>
                            {notParticipating.length}
                          </span>
                        </div>
                        <div className={styles.avatarsRow}>
                          {notParticipating.slice(0, 8).map((u) => (
                            <div
                              key={u.id}
                              className={`${styles.participantAvatar} ${styles.notParticipatingAvatar}`}
                              data-tooltip={u.pseudo ?? ""}
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
                              <span className={styles.avatarTooltip}>{u.pseudo}</span>
                            </div>
                          ))}
                          {notParticipating.length > 8 && (
                            <div className={`${styles.participantAvatar} ${styles.notParticipatingAvatar}`}>
                              <span className={styles.avatarPlaceholder}>
                                +{notParticipating.length - 8}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={styles.eventFooter}>
                      <div className={styles.eventDateFull}>
                        📆 {fmtDate(eventDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
