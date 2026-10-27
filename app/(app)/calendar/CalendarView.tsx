"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AvailabilityVM, EventVM, UserVM } from "@/lib/queries";
import { WEEKDAYS_SHORT, currentMonth, fmtDayLong, fmtTime, monthGrid, monthLabel, shiftMonth, todayKey } from "@/lib/dates";
import Sheet from "../../components/Sheet";
import Avatar, { AvatarStack } from "../../components/Avatar";
import MyDayStatus from "../_components/MyDayStatus";
import { AVAIL_META, indexByDay, splitMembers } from "../_components/dayData";
import styles from "./calendar.module.css";

const STATUS_CLASS = { YES: styles.evYes, MAYBE: styles.evMaybe, NO: styles.evNo } as const;

export default function CalendarView({
  month,
  events,
  availabilities,
  members,
  meId,
  initialDay,
}: {
  month: string;
  events: EventVM[];
  availabilities: AvailabilityVM[];
  members: UserVM[];
  meId: number;
  initialDay: string | null;
}) {
  const [selected, setSelected] = useState<string | null>(initialDay);
  const cells = useMemo(() => monthGrid(month), [month]);
  const keys = useMemo(() => cells.filter(Boolean) as string[], [cells]);
  const days = useMemo(() => indexByDay(keys, events, availabilities), [keys, events, availabilities]);
  const today = todayKey();
  const others = members.filter((m) => m.id !== meId);

  const info = selected ? days.get(selected) : undefined;
  const groups = splitMembers(info, others);
  const myStatus = info?.byUser.get(meId)?.type ?? null;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Calendrier</h1>
          <p className="page-subtitle">Touche un jour pour voir qui est dispo</p>
        </div>
      </header>

      <div className="card" style={{ padding: "12px 10px 14px" }}>
        <div className={styles.monthNav}>
          <Link href={`/calendar?m=${shiftMonth(month, -1)}`} className="btn btn-icon btn-outline" aria-label="Mois précédent" scroll={false}>
            ‹
          </Link>
          <div style={{ textAlign: "center" }}>
            <h2 className={styles.monthTitle}>{monthLabel(month)}</h2>
            {month !== currentMonth() && (
              <Link href="/calendar" className={styles.todayLink} scroll={false}>
                Revenir à aujourd'hui
              </Link>
            )}
          </div>
          <Link href={`/calendar?m=${shiftMonth(month, 1)}`} className="btn btn-icon btn-outline" aria-label="Mois suivant" scroll={false}>
            ›
          </Link>
        </div>

        <div className={styles.weekdays} aria-hidden>
          {WEEKDAYS_SHORT.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className={styles.grid}>
          {cells.map((key, i) => {
            if (!key) return <span key={`e${i}`} />;
            const d = days.get(key)!;
            const avail = others.filter((m) => d.byUser.get(m.id)?.type === "AVAILABLE").length;
            const mine = d.byUser.get(meId)?.type;
            const heat = others.length ? avail / others.length : 0;
            const past = key < today;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.day} ${key === today ? styles.today : ""} ${past ? styles.past : ""}`}
                style={{ "--heat": heat } as React.CSSProperties}
                onClick={() => setSelected(key)}
                aria-label={`${fmtDayLong(key + "T12:00:00Z")}${d.events.length ? `, ${d.events.length} sortie(s)` : ""}${avail ? `, ${avail} dispo` : ""}`}
              >
                <span className={styles.num}>
                  {Number(key.slice(8))}
                  {mine && <span className={styles.mine} data-kind={mine} />}
                </span>
                <span className={styles.events}>
                  {d.events.slice(0, 2).map((e) => (
                    <span key={e.id} className={`${styles.ev} ${e.myStatus ? STATUS_CLASS[e.myStatus] : styles.evPending}`}>
                      {e.emoji}
                    </span>
                  ))}
                  {d.events.length > 2 && <span className={styles.more}>+{d.events.length - 2}</span>}
                </span>
                {avail > 0 && <span className={styles.availCount}>{avail}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.legend}>
        <span><i className={styles.legendHeat} /> Potes dispo</span>
        <span><i className={styles.mine} data-kind="AVAILABLE" /> Moi dispo</span>
        <span><i className={styles.mine} data-kind="BUSY" /> Moi pris</span>
        <span><i className={`${styles.legendEv} ${styles.evPending}`} /> À répondre</span>
      </div>

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? capitalize(fmtDayLong(selected + "T12:00:00Z")) : ""}
      >
        {selected && (
          <div className="stack" style={{ gap: 20 }}>
            <section>
              <h3 className="section-title">Sorties</h3>
              {info && info.events.length > 0 ? (
                <div className="stack" style={{ gap: 8 }}>
                  {info.events.map((e) => (
                    <Link key={e.id} href={`/events/${e.id}`} className={styles.sheetEvent}>
                      <span className={styles.sheetEmoji}>{e.emoji}</span>
                      <span className="grow">
                        <strong className="ellipsis" style={{ display: "block" }}>{e.title}</strong>
                        <span className="small muted">
                          {fmtTime(e.start)}
                          {e.location ? ` · ${e.location}` : ""} · {e.yes.length} 👍
                        </span>
                      </span>
                      <span className={`badge ${e.myStatus === "YES" ? "badge-yes" : e.myStatus === "MAYBE" ? "badge-maybe" : e.myStatus === "NO" ? "badge-no" : "badge-pending"}`}>
                        {e.myStatus === "YES" ? "J'y vais" : e.myStatus === "MAYBE" ? "Peut-être" : e.myStatus === "NO" ? "Non" : "Répondre"}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="muted small" style={{ paddingInline: 4 }}>Rien de prévu ce jour-là.</p>
              )}
              {selected >= today && (
                <Link href={`/events/new?date=${selected}`} className="btn btn-secondary btn-block" style={{ marginTop: 10 }}>
                  + Proposer une sortie ce jour-là
                </Link>
              )}
            </section>

            {selected >= today && (
              <section>
                <h3 className="section-title">Et moi ?</h3>
                <MyDayStatus day={selected} status={myStatus} />
              </section>
            )}

            <section>
              <h3 className="section-title">Les potes</h3>
              <div className="stack" style={{ gap: 10 }}>
                {(["AVAILABLE", "VACATION", "BUSY"] as const).map((t) =>
                  groups[t].length > 0 ? (
                    <div key={t} className={styles.group}>
                      <span className={`badge ${AVAIL_META[t].badge}`}>
                        {AVAIL_META[t].emoji} {AVAIL_META[t].label} · {groups[t].length}
                      </span>
                      <div className={styles.names}>
                        {groups[t].map((u) => (
                          <span key={u.id} className={styles.name}>
                            <Avatar user={u} size={24} /> {u.pseudo}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
                {groups.UNKNOWN.length > 0 && (
                  <div className={styles.group}>
                    <span className="badge badge-neutral">❔ Pas renseigné · {groups.UNKNOWN.length}</span>
                    <div className={styles.names}>
                      <AvatarStack users={groups.UNKNOWN} max={8} size={24} />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </Sheet>
    </main>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
