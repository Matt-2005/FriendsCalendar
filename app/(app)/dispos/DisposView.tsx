"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserVM } from "@/lib/queries";
import { WEEKDAYS_SHORT, currentMonth, fmtDayLong, fmtDayShort, monthGrid, monthLabel, shiftMonth, todayKey, weekdayIndex, addDaysToKey } from "@/lib/dates";
import { AvatarStack } from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";
import { AVAIL_META, type AvailType } from "../_components/dayData";
import styles from "./dispos.module.css";

export type BestDay = { key: string; free: UserVM[]; busy: number; events: { id: number; title: string; emoji: string }[] };
type Period = { id: number; type: AvailType; start: string; end: string; note: string | null };
type Brush = AvailType | "ERASE";

const BRUSHES: { key: Brush; emoji: string; label: string }[] = [
  { key: "AVAILABLE", emoji: "✅", label: "Dispo" },
  { key: "BUSY", emoji: "⛔", label: "Pas dispo" },
  { key: "VACATION", emoji: "🌴", label: "Vacances" },
  { key: "ERASE", emoji: "🧽", label: "Effacer" },
];

const noon = (k: string) => k + "T12:00:00Z";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DisposView({
  month,
  mine: initialMine,
  best,
  periods,
  membersCount,
}: {
  month: string;
  mine: Record<string, string>;
  best: BestDay[];
  periods: Period[];
  membersCount: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [mine, setMine] = useState<Record<string, AvailType | undefined>>(initialMine as Record<string, AvailType>);
  const [brush, setBrush] = useState<Brush>("AVAILABLE");
  const [toDelete, setToDelete] = useState<Period | null>(null);
  const [busy, setBusy] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(0);

  // Reprend les données du serveur quand aucune modification n'est en cours
  useEffect(() => {
    if (pending.current === 0) setMine(initialMine as Record<string, AvailType>);
  }, [initialMine]);

  const today = todayKey();
  const cells = monthGrid(month);

  function scheduleRefresh() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 1200);
  }

  async function apply(days: string[], type: AvailType | null) {
    const before = Object.fromEntries(days.map((d) => [d, mine[d]]));
    setMine((m) => {
      const next = { ...m };
      for (const d of days) next[d] = type ?? undefined;
      return next;
    });
    pending.current++;
    const res = await fetch("/api/availabilities/day", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, type }),
    }).catch(() => null);
    pending.current--;
    if (!res?.ok) {
      setMine((m) => ({ ...m, ...before }));
      toast("Pas de connexion, réessaie");
      return false;
    }
    scheduleRefresh();
    return true;
  }

  function tapDay(key: string) {
    if (key < today) return;
    const type = brush === "ERASE" ? null : brush;
    // Toucher un jour déjà de la bonne couleur l'efface
    apply([key], mine[key] === type ? null : type);
    if ("vibrate" in navigator) navigator.vibrate?.(8);
  }

  async function fillWeekends() {
    const days = (cells.filter(Boolean) as string[]).filter((k) => k >= today && [4, 5].includes(weekdayIndex(k)));
    if (days.length === 0) return;
    const type = brush === "ERASE" ? null : brush;
    if (await apply(days, type)) {
      toast(type ? `${AVAIL_META[type].emoji} Vendredis et samedis marqués` : "Vendredis et samedis effacés");
    }
  }

  async function deletePeriod() {
    if (!toDelete) return;
    setBusy(true);
    const res = await fetch(`/api/availabilities/${toDelete.id}`, { method: "DELETE" });
    setBusy(false);
    setToDelete(null);
    if (res.ok) {
      toast("Période supprimée");
      router.refresh();
    } else toast("Impossible de supprimer");
  }

  const filled = Object.values(mine).filter(Boolean).length;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Mes dispos</h1>
          <p className="page-subtitle">Dis aux potes quand tu es libre, en 2 gestes.</p>
        </div>
      </header>

      {/* Meilleurs jours */}
      <section>
        <h2 className="section-title">⭐ Les meilleurs jours pour se voir</h2>
        {best.length === 0 ? (
          <div className="card card-text">
            Pas encore assez de dispos renseignées. Remplis les tiennes ci-dessous et demande aux autres d'en faire autant !
          </div>
        ) : (
          <div className={styles.bestList}>
            {best.map((d) => (
              <div key={d.key} className={`card ${styles.best}`}>
                <div className="grow">
                  <div className={styles.bestDay}>{cap(fmtDayLong(noon(d.key)))}</div>
                  <div className="row" style={{ marginTop: 6, gap: 8 }}>
                    <AvatarStack users={d.free} max={5} size={24} />
                    <span className="small muted" style={{ fontWeight: 600 }}>
                      {d.free.length}/{membersCount} dispo
                    </span>
                  </div>
                  {d.events.length > 0 && (
                    <Link href={`/events/${d.events[0].id}`} className={styles.bestEvent}>
                      {d.events[0].emoji} Déjà prévu : {d.events[0].title}
                    </Link>
                  )}
                </div>
                {d.events.length === 0 && (
                  <Link href={`/events/new?date=${d.key}`} className="btn btn-secondary btn-sm">
                    Proposer
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Peinture des jours */}
      <section className="section">
        <h2 className="section-title">
          <span>1. Choisis… 2. Touche les jours</span>
        </h2>
        <div className={styles.brushes} role="radiogroup" aria-label="Statut à appliquer">
          {BRUSHES.map((b) => (
            <button
              key={b.key}
              type="button"
              role="radio"
              aria-checked={brush === b.key}
              className={styles.brush}
              data-kind={b.key}
              onClick={() => setBrush(b.key)}
            >
              <span aria-hidden>{b.emoji}</span>
              {b.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "12px 10px 14px", marginTop: 12 }}>
          <div className={styles.monthNav}>
            <Link href={`/dispos?m=${shiftMonth(month, -1)}`} className="btn btn-icon btn-outline" aria-label="Mois précédent" scroll={false}>
              ‹
            </Link>
            <div style={{ textAlign: "center" }}>
              <h3 className={styles.monthTitle}>{monthLabel(month)}</h3>
              {month !== currentMonth() && (
                <Link href="/dispos" className={styles.todayLink} scroll={false}>
                  Revenir à aujourd'hui
                </Link>
              )}
            </div>
            <Link href={`/dispos?m=${shiftMonth(month, 1)}`} className="btn btn-icon btn-outline" aria-label="Mois suivant" scroll={false}>
              ›
            </Link>
          </div>
          <div className={styles.weekdays} aria-hidden>
            {WEEKDAYS_SHORT.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className={styles.grid}>
            {cells.map((key, i) =>
              key ? (
                <button
                  key={key}
                  type="button"
                  className={`${styles.day} ${key === today ? styles.today : ""}`}
                  data-kind={mine[key] ?? "NONE"}
                  disabled={key < today}
                  onClick={() => tapDay(key)}
                  aria-label={`${fmtDayLong(noon(key))} : ${mine[key] ? AVAIL_META[mine[key]!].label : "non renseigné"}`}
                >
                  <span className={styles.num}>{Number(key.slice(8))}</span>
                  <span className={styles.icon} aria-hidden>
                    {mine[key] ? AVAIL_META[mine[key]!].emoji : ""}
                  </span>
                </button>
              ) : (
                <span key={`e${i}`} />
              )
            )}
          </div>
          <button type="button" className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 10 }} onClick={fillWeekends}>
            {brush === "ERASE" ? "🧽 Effacer" : `${BRUSHES.find((b) => b.key === brush)!.emoji} Appliquer`} sur tous les vendredis et samedis
          </button>
        </div>
        <p className="hint" style={{ textAlign: "center", marginTop: 8 }}>
          {filled === 0 ? "Astuce : touche à nouveau un jour pour l'effacer." : `${filled} jour${filled > 1 ? "s" : ""} renseigné${filled > 1 ? "s" : ""} ce mois-ci.`}
        </p>
      </section>

      {/* Période longue */}
      <section className="section">
        <h2 className="section-title">🌴 Partir en vacances ?</h2>
        <PeriodForm onDone={() => router.refresh()} />
        {periods.length > 0 && (
          <div className="card list-card" style={{ marginTop: 12 }}>
            {periods.map((p) => (
              <div key={p.id} className="list-item">
                <span style={{ fontSize: 22 }}>{AVAIL_META[p.type].emoji}</span>
                <div className="grow">
                  <div style={{ fontWeight: 650 }}>
                    {fmtDayShort(p.start)} → {fmtDayShort(p.end)}
                  </div>
                  <div className="small muted">{p.note || AVAIL_META[p.type].label}</div>
                </div>
                <button type="button" className="btn btn-icon" aria-label="Supprimer" onClick={() => setToDelete(p)} style={{ background: "var(--surface-2)" }}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title="Supprimer cette période ?"
        text={toDelete ? `${fmtDayShort(toDelete.start)} → ${fmtDayShort(toDelete.end)}` : ""}
        confirmLabel="Supprimer"
        danger
        loading={busy}
        onConfirm={deletePeriod}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
}

function PeriodForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const today = todayKey();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<AvailType>("VACATION");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!start || !end) return toast("Choisis les deux dates");
    setBusy(true);
    const res = await fetch("/api/availabilities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end, type, note }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast("Impossible d'enregistrer, réessaie");
    toast("Période ajoutée ✓");
    setStart("");
    setEnd("");
    setNote("");
    onDone();
  }

  return (
    <form onSubmit={submit} className="card stack" style={{ gap: 12 }}>
      <div className="grid-2">
        <div className="field">
          <label className="label" htmlFor="p-start">Du</label>
          <input id="p-start" type="date" className="input" min={today} value={start} onChange={(e) => {
            setStart(e.target.value);
            if (!end || end < e.target.value) setEnd(e.target.value > today ? addDaysToKey(e.target.value, 6) : e.target.value);
          }} />
        </div>
        <div className="field">
          <label className="label" htmlFor="p-end">Au</label>
          <input id="p-end" type="date" className="input" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="chips">
        {(["VACATION", "BUSY", "AVAILABLE"] as AvailType[]).map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={type === t} onClick={() => setType(t)}>
            {AVAIL_META[t].emoji} {AVAIL_META[t].label}
          </button>
        ))}
      </div>
      <input className="input" placeholder="Petite note (facultatif) : Bretagne, boulot…" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy || !start || !end}>
        {busy ? <span className="spinner" /> : "Ajouter la période"}
      </button>
    </form>
  );
}
