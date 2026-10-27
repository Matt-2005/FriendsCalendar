import Link from "next/link";
import type { EventVM } from "@/lib/queries";
import { fmtDayNumber, fmtMonthShort, fmtTime, fmtWeekdayShort, relativeDayLabel, dayKey, todayKey, daysBetweenKeys } from "@/lib/dates";
import { AvatarStack } from "../../../components/Avatar";
import RsvpButtons from "../../../components/RsvpButtons";
import styles from "./events.module.css";

export function StatusBadge({ status }: { status: EventVM["myStatus"] }) {
  if (status === "YES") return <span className="badge badge-yes">👍 J'y vais</span>;
  if (status === "MAYBE") return <span className="badge badge-maybe">🤔 Peut-être</span>;
  if (status === "NO") return <span className="badge badge-no">Pas dispo</span>;
  return <span className="badge badge-pending">À toi de répondre</span>;
}

export default function EventCard({ event, past = false }: { event: EventVM; past?: boolean }) {
  const start = new Date(event.start);
  const diff = daysBetweenKeys(todayKey(), dayKey(start));
  const soon = !past && diff >= 0 && diff <= 1;
  const going = [...event.yes, ...event.maybe];

  return (
    <article className={`card ${styles.card} ${past ? styles.past : ""}`}>
      <Link href={`/events/${event.id}`} className={styles.cardLink}>
        <div className={`${styles.dateBlock} ${soon ? styles.dateSoon : ""}`}>
          <span className={styles.dateWeekday}>{fmtWeekdayShort(start)}</span>
          <span className={styles.dateDay}>{fmtDayNumber(start)}</span>
          <span className={styles.dateMonth}>{fmtMonthShort(start)}</span>
        </div>
        <div className="grow">
          <h3 className={styles.title}>
            <span aria-hidden>{event.emoji}</span> {event.title}
          </h3>
          <p className={styles.meta}>
            {soon ? <strong>{relativeDayLabel(start)}</strong> : null}
            {soon ? " · " : ""}
            {fmtTime(start)}
            {event.end && dayKey(event.end) === dayKey(start) ? ` → ${fmtTime(event.end)}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </p>
          <div className={styles.footer}>
            {going.length > 0 ? (
              <>
                <AvatarStack users={going} max={4} size={26} />
                <span className={styles.count}>
                  {event.yes.length} {event.yes.length > 1 ? "viennent" : "vient"}
                  {event.maybe.length > 0 ? ` · ${event.maybe.length} peut-être` : ""}
                </span>
              </>
            ) : (
              <span className={styles.count}>Personne pour l'instant</span>
            )}
          </div>
        </div>
        <span className={styles.chevron} aria-hidden>›</span>
      </Link>

      {!past && (
        <div className={styles.rsvpRow}>
          {event.myStatus === null && <p className={styles.question}>Tu viens ?</p>}
          <RsvpButtons eventId={event.id} status={event.myStatus} compact />
        </div>
      )}
      {past && (
        <div className={styles.rsvpRow}>
          <StatusBadge status={event.myStatus} />
        </div>
      )}
    </article>
  );
}
