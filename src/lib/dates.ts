// Toutes les dates sont affichées à l'heure de Paris, côté serveur comme côté navigateur.
// Sans ça, le serveur (en UTC) affiche les heures avec 1 à 2 h de décalage.
export const TZ = "Europe/Paris";

type DateInput = Date | string | number;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, ...opts });
    fmtCache.set(key, f);
  }
  return f;
}

/** "20:30" → affiché "20h30", "20:00" → "20h" */
export function fmtTime(d: DateInput) {
  const [h, m] = fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(toDate(d)).split(":");
  return m === "00" ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** "samedi 2 novembre" */
export function fmtDayLong(d: DateInput) {
  return fmt({ weekday: "long", day: "numeric", month: "long" }).format(toDate(d));
}

/** "sam. 2 nov." */
export function fmtDayShort(d: DateInput) {
  return fmt({ weekday: "short", day: "numeric", month: "short" }).format(toDate(d));
}

export function fmtWeekdayShort(d: DateInput) {
  return fmt({ weekday: "short" }).format(toDate(d)).replace(".", "");
}

export function fmtMonthShort(d: DateInput) {
  return fmt({ month: "short" }).format(toDate(d)).replace(".", "");
}

export function fmtDayNumber(d: DateInput) {
  return fmt({ day: "numeric" }).format(toDate(d));
}

/** Clé "YYYY-MM-DD" du jour à Paris */
export function dayKey(d: DateInput) {
  const parts = fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(toDate(d));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/** Décalage (en minutes) entre Paris et UTC à un instant donné */
function parisOffsetMinutes(utcMs: number) {
  const parts = fmt({
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - utcMs) / 60000);
}

/** Instant UTC correspondant à "YYYY-MM-DD HH:mm" heure de Paris */
export function parisDateTime(key: string, hh = 0, mm = 0, ss = 0, ms = 0) {
  const { y, m, d } = parseKey(key);
  const guess = Date.UTC(y, m - 1, d, hh, mm, ss, ms);
  const offset = parisOffsetMinutes(guess);
  let result = guess - offset * 60000;
  // Corrige le cas où le changement d'heure tombe entre les deux
  const offset2 = parisOffsetMinutes(result);
  if (offset2 !== offset) result = guess - offset2 * 60000;
  return new Date(result);
}

export const parisDayStart = (key: string) => parisDateTime(key, 0, 0, 0, 0);
export const parisDayEnd = (key: string) => parisDateTime(key, 23, 59, 59, 999);

export function todayKey() {
  return dayKey(new Date());
}

export function addDaysToKey(key: string, days: number) {
  const { y, m, d } = parseKey(key);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** 0 = lundi … 6 = dimanche */
export function weekdayIndex(key: string) {
  const { y, m, d } = parseKey(key);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function daysBetweenKeys(a: string, b: string) {
  const pa = parseKey(a), pb = parseKey(b);
  return Math.round((Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000);
}

/** "Aujourd'hui", "Demain", "Samedi 2 novembre" */
export function relativeDayLabel(d: DateInput) {
  const diff = daysBetweenKeys(todayKey(), dayKey(d));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  const label = fmtDayLong(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Libellé complet d'un horaire d'événement : "Samedi 2 novembre · 20h → 23h" */
export function eventWhen(start: DateInput, end?: DateInput | null) {
  const s = toDate(start);
  const day = relativeDayLabel(s);
  if (!end) return `${day} · ${fmtTime(s)}`;
  const e = toDate(end);
  if (dayKey(s) === dayKey(e)) return `${day} · ${fmtTime(s)} → ${fmtTime(e)}`;
  return `${day} ${fmtTime(s)} → ${fmtDayShort(e)} ${fmtTime(e)}`;
}

/** Valeurs pour <input type="date"> et <input type="time"> à l'heure de Paris */
export function toInputs(d: DateInput) {
  const date = toDate(d);
  const time = fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return { date: dayKey(date), time: time.startsWith("24") ? "00" + time.slice(2) : time };
}

/** "YYYY-MM-DD" + "HH:mm" (heure de Paris) → Date */
export function fromInputs(date: string, time: string) {
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  return parisDateTime(date, hh, mm);
}

export const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
export const WEEKDAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

/** "2026-11" → cases du mois (null = case vide avant le 1er, semaine commençant lundi) */
export function monthGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(weekdayIndex(first)).fill(null);
  for (let d = 0; d < daysInMonth; d++) cells.push(addDaysToKey(first, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export const currentMonth = () => todayKey().slice(0, 7);
