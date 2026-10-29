"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDaysToKey, fromInputs, relativeDayLabel, todayKey, weekdayIndex, fmtTime, dayKey, toInputs } from "@/lib/dates";
import { eventEmoji } from "@/lib/eventEmoji";
import { errorMessage } from "@/lib/errors";
import { useToast } from "../../../components/Toast";

export type EventFormValues = {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endDate: string;
  endTime: string;
  location: string;
  description: string;
};

const TIME_CHIPS = ["12:00", "18:30", "19:30", "20:00", "21:00"];
const DURATIONS: { label: string; value: Duration }[] = [
  { label: "1 h", value: 60 },
  { label: "2 h", value: 120 },
  { label: "3 h", value: 180 },
  { label: "Toute la soirée", value: "evening" },
  { label: "Autre…", value: "custom" },
];
const IDEAS = ["🍻 Apéro", "🍽️ Resto", "🎬 Ciné", "🎲 Soirée jeux", "⚽ Foot", "🎉 Soirée"];

/** Prochain jour de la semaine donné (0 = lundi), jamais aujourd'hui */
function nextWeekday(target: number) {
  const t = todayKey();
  const diff = (target - weekdayIndex(t) + 7) % 7 || 7;
  return addDaysToKey(t, diff);
}

type Duration = number | "evening" | "custom" | null;

export type PlaceSuggestions = {
  /** Moi en premier, puis les autres membres */
  hosts: { id: number; pseudo: string; isMe: boolean }[];
  /** Lieux utilisés récemment (bars, restos…) */
  recent: string[];
};

export default function EventForm({
  initial,
  eventId,
  groupId,
  places,
}: {
  initial?: Partial<EventFormValues>;
  eventId?: number;
  /** Groupe de la nouvelle sortie (celui affiché quand le formulaire a été ouvert) */
  groupId?: number;
  places?: PlaceSuggestions;
}) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState<EventFormValues>({
    title: "",
    date: "",
    time: "20:00",
    endDate: "",
    endTime: "",
    location: "",
    description: "",
    ...initial,
  });
  const [duration, setDurationState] = useState<Duration>(initial?.endTime ? "custom" : null);
  const [showMore, setShowMore] = useState(Boolean(initial?.description));
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<EventFormValues>) => setV((x) => ({ ...x, ...patch }));

  const today = todayKey();
  const dateChips = useMemo(
    () => [
      { label: "Ce soir", date: today },
      { label: "Demain", date: addDaysToKey(today, 1) },
      { label: weekdayIndex(today) === 5 ? "Samedi prochain" : "Samedi", date: nextWeekday(5) },
      { label: weekdayIndex(today) === 4 ? "Vendredi prochain" : "Vendredi", date: nextWeekday(4) },
    ],
    [today]
  );

  function chooseDuration(d: Duration) {
    if (d === "custom" && start) {
      // On pré-remplit avec +2 h pour partir d'une base
      const base = new Date(start.getTime() + 2 * 3600e3);
      set({ endDate: dayKey(base), endTime: toInputs(base).time });
    }
    setDurationState((cur) => (cur === d ? null : d));
  }

  const start = v.date && v.time ? fromInputs(v.date, v.time) : null;
  let end: Date | null = null;
  if (start && typeof duration === "number") end = new Date(start.getTime() + duration * 60000);
  if (start && duration === "evening") {
    // "Toute la soirée" : jusqu'à 2 h du matin
    end = fromInputs(Number(v.time.slice(0, 2)) < 2 ? v.date : addDaysToKey(v.date, 1), "02:00");
  }
  if (start && duration === "custom" && v.endTime) end = fromInputs(v.endDate || v.date, v.endTime);
  const canSubmit = v.title.trim() && start && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!v.title.trim()) return setErr("Donne un nom à ta sortie");
    if (!start) return setErr("Choisis une date et une heure");
    if (end && end <= start) return setErr("L'heure de fin doit être après le début");
    if (!eventId && start < new Date(Date.now() - 3600e3)) return setErr("Cette date est déjà passée");

    setLoading(true);
    try {
      const res = await fetch(eventId ? `/api/events/${eventId}` : "/api/events", {
        method: eventId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: v.title.trim(),
          location: v.location.trim(),
          description: v.description.trim(),
          date: start.toISOString(),
          endDate: end ? end.toISOString() : null,
          ...(eventId ? {} : { groupId }),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Erreur serveur");
      toast(eventId ? "Modifications enregistrées ✓" : "Sortie proposée ! Les potes sont prévenus 🎉");
      router.replace(`/events/${eventId ?? j.id}`);
      router.refresh();
    } catch (e) {
      setErr(errorMessage(e, "Pas de connexion, réessaie"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 22 }} noValidate>
      {/* Quoi */}
      <div className="field">
        <label htmlFor="title" className="label">
          Quoi ?
        </label>
        <input
          id="title"
          className="input"
          value={v.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Ex : Apéro chez Léa"
          maxLength={120}
          autoComplete="off"
          enterKeyHint="next"
          autoFocus={!eventId}
        />
        {!eventId && !v.title && (
          <div className="chips" style={{ marginTop: 4 }}>
            {IDEAS.map((idea) => (
              <button key={idea} type="button" className="chip" onClick={() => set({ title: idea.slice(idea.indexOf(" ") + 1) })}>
                {idea}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quand */}
      <div className="field">
        <span className="label">Quand ?</span>
        <div className="chips">
          {dateChips.map((c) => (
            <button key={c.label} type="button" className="chip" aria-pressed={v.date === c.date} onClick={() => set({ date: c.date, endDate: "" })}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="grid-2" style={{ marginTop: 6 }}>
          <input
            type="date"
            className="input"
            aria-label="Date"
            value={v.date}
            min={eventId ? undefined : today}
            onChange={(e) => set({ date: e.target.value, endDate: "" })}
          />
          <input type="time" className="input" aria-label="Heure" value={v.time} step={300} onChange={(e) => set({ time: e.target.value })} />
        </div>
        <div className="chips" style={{ marginTop: 6 }}>
          {TIME_CHIPS.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={v.time === t} onClick={() => set({ time: t })}>
              {fmtTime(fromInputs(today, t))}
            </button>
          ))}
        </div>
        {start && (
          <p className="alert alert-info" style={{ marginTop: 8 }}>
            🗓️ {relativeDayLabel(start)} à {fmtTime(start)}
            {end ? ` → ${dayKey(end) !== dayKey(start) ? relativeDayLabel(end).toLowerCase() + " " : ""}${fmtTime(end)}` : ""}
          </p>
        )}
      </div>

      {/* Fin (optionnelle) */}
      <div className="field">
        <span className="label">
          Durée <span className="label-hint">(facultatif)</span>
        </span>
        <div className="chips">
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              className="chip"
              aria-pressed={duration === d.value}
              onClick={() => chooseDuration(d.value)}
              disabled={!start}
            >
              {d.label}
            </button>
          ))}
        </div>
        {duration === "custom" && (
          <div className="grid-2" style={{ marginTop: 6 }}>
            <input
              type="date"
              className="input"
              aria-label="Date de fin"
              value={v.endDate || v.date}
              min={v.date}
              onChange={(e) => set({ endDate: e.target.value })}
            />
            <input
              type="time"
              className="input"
              aria-label="Heure de fin"
              value={v.endTime}
              step={300}
              onChange={(e) => set({ endTime: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Où */}
      <div className="field">
        <label htmlFor="location" className="label">
          Où ? <span className="label-hint">(facultatif)</span>
        </label>
        <input
          id="location"
          className="input"
          value={v.location}
          onChange={(e) => set({ location: e.target.value })}
          placeholder="Ex : Chez Léa, Le Bar du Coin…"
          maxLength={200}
          autoComplete="off"
        />
        {places && (places.hosts.length > 0 || places.recent.length > 0) && (
          <div className="chips" style={{ marginTop: 4 }}>
            {places.hosts.map((h) => {
              // "Chez moi" est enregistré avec le prénom : sinon chacun le lirait comme chez lui
              const value = `Chez ${h.pseudo}`;
              return (
                <button
                  key={h.id}
                  type="button"
                  className="chip"
                  aria-pressed={v.location === value}
                  onClick={() => set({ location: v.location === value ? "" : value })}
                >
                  🏠 {h.isMe ? "Chez moi" : value}
                </button>
              );
            })}
            {places.recent.map((place) => (
              <button
                key={place}
                type="button"
                className="chip"
                aria-pressed={v.location === place}
                onClick={() => set({ location: v.location === place ? "" : place })}
              >
                📍 {place}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Détails */}
      {showMore ? (
        <div className="field">
          <label htmlFor="description" className="label">
            Détails <span className="label-hint">(facultatif)</span>
          </label>
          <textarea
            id="description"
            className="textarea"
            value={v.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Ce qu'il faut apporter, le code de la porte, le prix…"
            maxLength={2000}
            rows={4}
          />
        </div>
      ) : (
        <button type="button" className="btn btn-ghost" style={{ alignSelf: "flex-start", paddingInline: 4 }} onClick={() => setShowMore(true)}>
          + Ajouter des détails
        </button>
      )}

      {err && <div className="alert alert-error">⚠️ {err}</div>}

      <div className="form-submit">
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!canSubmit}>
          {loading ? (
            <span className="spinner" />
          ) : eventId ? (
            "Enregistrer"
          ) : (
            <>
              {v.title ? eventEmoji(v.title) : "✨"} Proposer la sortie
            </>
          )}
        </button>
        {!eventId && <p className="hint" style={{ textAlign: "center", marginTop: 8 }}>Tout le groupe recevra une notification.</p>}
      </div>
    </form>
  );
}
