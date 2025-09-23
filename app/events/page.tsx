// app/events/page.tsx — Server Component
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import Link from "next/link";
import RsvpButtons from "./RsvpButtons"; // 👈 composant client ci-dessous

function fmt(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    select: {
      id: true, title: true, date: true, location: true, description: true,
      // ✅ Participants = RSVPs YES
      rsvps: {
        where: { status: "YES" },
        select: { user: { select: { id: true, pseudo: true, avatarUrl: true } } },
      },
    },
    orderBy: { date: "asc" },
    take: 100,
  });

  return (
    <div className={styles.container}>
      <div className={styles.containerEvents}>
        <h2>Évènements à venir</h2>

        {events.length === 0 ? (
          <p>Aucun événement pour l’instant.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {events.map((e) => {
              const participants = e.rsvps.map(r => r.user);
              return (
                <li key={e.id} className={styles.eventItem}>
                  <div className={styles.eventMeta}>
                    {fmt(e.date)}{e.location ? ` · ${e.location}` : ""}
                  </div>
                  <div className={styles.eventTitle}>{e.title}</div>
                  {e.description && <div className={styles.eventDesc}>{e.description}</div>}

                  {/* Avatars participants */}
                  <div className={styles.eventParticipants}>
                    {participants.length === 0 ? (
                      <span className={styles.emptyParticipants}>Personne pour l’instant</span>
                    ) : (
                      <div className={styles.avatarsRow}>
                        {participants.map((u) => (
                          <div key={u.id} className={styles.participantItem} title={u.pseudo ?? ""}>
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.pseudo ?? "avatar"} className={styles.avatar} />
                            ) : (
                              <span className={styles.pseudoOnly}>{u.pseudo}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Boutons RSVP */}
                  <div className={styles.rsvpRow}>
                    <RsvpButtons eventId={e.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.calendar}>{/* calendrier plus tard */}</div>
    </div>
  );
}
