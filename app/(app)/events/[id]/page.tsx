import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { getEvent, getMembers, type UserVM } from "@/lib/queries";
import { eventWhen, fmtTime, fmtDayLong, dayKey, relativeDayLabel } from "@/lib/dates";
import { getBaseUrl } from "@/lib/url";
import Avatar from "../../../components/Avatar";
import RsvpButtons from "../../../components/RsvpButtons";
import { ManageButtons, RemindButton, ShareButton } from "../_components/EventActions";
import styles from "../_components/events.module.css";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const me = await requireMe();
  const e = await getEvent(me, Number((await params).id));
  return { title: e?.title ?? "Sortie" };
}

function gcalDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export default async function EventPage({ params }: Props) {
  const me = await requireMe();
  const event = await getEvent(me, Number((await params).id));
  if (!event) notFound();

  const [members, baseUrl] = await Promise.all([getMembers(event.groupId), getBaseUrl()]);
  const answered = new Set([...event.yes, ...event.maybe, ...event.no].map((u) => u.id));
  const pending = members.filter((m) => !answered.has(m.id));

  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : new Date(start.getTime() + 2 * 3600e3);
  const isPast = end < new Date();
  const url = `${baseUrl}/events/${event.id}`;

  const googleUrl =
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${gcalDate(start.toISOString())}/${gcalDate(end.toISOString())}`,
      details: `${event.description ? event.description + "\n\n" : ""}${url}`,
      location: event.location,
      ctz: "Europe/Paris",
    });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
  const shareText = `${event.emoji} ${event.title} — ${eventWhen(event.start, event.end)}${event.location ? ` · ${event.location}` : ""}. Tu viens ?`;

  return (
    <main className="page">
      <Link href="/events" className="back-link">
        ‹ Sorties
      </Link>

      <section className={styles.hero}>
        <div className={styles.heroEmoji} aria-hidden>
          {event.emoji}
        </div>
        <h1 className={styles.heroTitle}>{event.title}</h1>
        <div className={styles.heroBy}>
          <Avatar user={event.creator} size={22} />
          Proposé par {event.creator.id === me.id ? "toi" : event.creator.pseudo}
          {me.memberships.length > 1 && <span className="badge badge-neutral">👥 {event.groupName}</span>}
        </div>
      </section>

      <div className="card list-card section" style={{ marginTop: 20 }}>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>🗓️</span>
            <div>
              <div className={styles.infoMain}>{relativeDayLabel(start)}</div>
              <div className={styles.infoSub}>
                {fmtTime(start)}
                {event.end
                  ? dayKey(event.end) === dayKey(start)
                    ? ` → ${fmtTime(event.end)}`
                    : ` → ${fmtDayLong(event.end)} à ${fmtTime(event.end)}`
                  : ""}
              </div>
            </div>
          </div>
          {event.location && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.infoItem}>
              <span className={styles.infoIcon}>📍</span>
              <div>
                <div className={styles.infoMain}>{event.location}</div>
                <div className={styles.infoLink}>Voir sur la carte ›</div>
              </div>
            </a>
          )}
          {event.description && (
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>💬</span>
              <p className={styles.description}>{event.description}</p>
            </div>
          )}
        </div>
      </div>

      {!isPast && (
        <section className="section">
          <h2 className="section-title">{event.myStatus ? "Ta réponse" : "Tu viens ?"}</h2>
          <RsvpButtons eventId={event.id} status={event.myStatus} />
        </section>
      )}

      <section className="section">
        <h2 className="section-title">
          <span>Qui vient ?</span>
          {event.canManage && !isPast && <RemindButton eventId={event.id} pendingCount={pending.length} />}
        </h2>
        <div className="card">
          <PeopleGroup label="👍 Viennent" users={event.yes} meId={me.id} creatorId={event.creator.id} emptyText="Personne pour l'instant" />
          {event.maybe.length > 0 && <PeopleGroup label="🤔 Peut-être" users={event.maybe} meId={me.id} creatorId={event.creator.id} />}
          {event.no.length > 0 && <PeopleGroup label="👎 Pas dispo" users={event.no} meId={me.id} creatorId={event.creator.id} />}
          {pending.length > 0 && !isPast && (
            <PeopleGroup label="⏳ Pas encore répondu" users={pending} meId={me.id} creatorId={event.creator.id} />
          )}
        </div>
      </section>

      {!isPast && (
        <section className="section">
          <h2 className="section-title">Dans mon agenda</h2>
          <div className="grid-2">
            <a href={`/api/events/${event.id}/ics`} className="btn btn-outline">
              🍎 iPhone
            </a>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              📆 Google
            </a>
          </div>
          <p className="hint" style={{ marginTop: 8, paddingInline: 4 }}>
            Astuce : synchronise toutes les sorties d'un coup depuis ton <Link href="/account#agenda" style={{ color: "var(--primary)", fontWeight: 600 }}>profil</Link>.
          </p>
          <div style={{ marginTop: 12 }}>
            <ShareButton title={event.title} text={shareText} url={url} />
          </div>
        </section>
      )}

      {event.canManage && (
        <section className="section">
          <h2 className="section-title">Organisation</h2>
          <ManageButtons eventId={event.id} title={event.title} />
        </section>
      )}
    </main>
  );
}

function PeopleGroup({
  label,
  users,
  meId,
  creatorId,
  emptyText,
}: {
  label: string;
  users: UserVM[];
  meId: number;
  creatorId: number;
  emptyText?: string;
}) {
  if (users.length === 0 && !emptyText) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="small muted" style={{ fontWeight: 700, marginBottom: 4 }}>
        {label} · {users.length}
      </div>
      {users.length === 0 ? (
        <p className="small muted">{emptyText}</p>
      ) : (
        <div className={styles.people}>
          {users.map((u) => (
            <div key={u.id} className={styles.person}>
              <Avatar user={u} size={32} />
              <span>{u.id === meId ? `${u.pseudo} (toi)` : u.pseudo}</span>
              {u.id === creatorId && <span className={styles.personTag}>organise</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
