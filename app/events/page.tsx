// app/events/page.tsx — Server Component
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import RsvpButtons from "./RsvpButtons";
import DeleteEventButton from "./DeleteEventButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Calendar from "./calendar";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  const events = await prisma.event.findMany({
    select: {
      id: true, title: true, date: true, location: true, description: true,
      creatorId: true,                                   // 👈 pour savoir si je suis le créateur
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
                  {/* bouton supprimer en haut-gauche, uniquement pour le créateur */}
                  {meId === e.creatorId && (
                    <div className={styles.eventDeleteSlot}>
                      <DeleteEventButton eventId={e.id} />
                    </div>
                  )}

                  <div className={styles.eventMeta}>
                    {fmt(e.date)}{e.location ? ` · ${e.location}` : ""}
                  </div>
                  <div className={styles.eventTitle}>{e.title}</div>
                  {e.description && <div className={styles.eventDesc}>{e.description}</div>}

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

                  <div className={styles.rsvpRow}>
                    <RsvpButtons eventId={e.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={styles.calendar}>
        <Calendar key={events.length} />
      </div>
    </div>
  );
}
