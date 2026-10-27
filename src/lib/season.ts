import { dayKey } from "./dates";

export type SeasonKey = "halloween" | "noel" | "nouvel-an" | "ete";

export type Season = {
  key: SeasonKey;
  label: string;
  emoji: string;
};

const SEASONS: Record<SeasonKey, Season> = {
  halloween: { key: "halloween", label: "Halloween", emoji: "🎃" },
  noel: { key: "noel", label: "Noël", emoji: "🎄" },
  "nouvel-an": { key: "nouvel-an", label: "Nouvel An", emoji: "🥂" },
  ete: { key: "ete", label: "Été", emoji: "☀️" },
};

/** Périodes au format "MM-JJ" (heure de Paris), bornes incluses */
const PERIODS: [SeasonKey, string, string][] = [
  ["halloween", "10-15", "11-02"],
  ["noel", "12-01", "12-26"],
  ["nouvel-an", "12-27", "12-31"],
  ["nouvel-an", "01-01", "01-03"],
  ["ete", "07-01", "08-31"],
];

/** Thème du moment, ou null hors période. SEASON_OVERRIDE permet de prévisualiser un thème. */
export function currentSeason(date = new Date()): Season | null {
  const override = process.env.SEASON_OVERRIDE as SeasonKey | "none" | undefined;
  if (override === "none") return null;
  if (override && SEASONS[override]) return SEASONS[override];
  const md = dayKey(date).slice(5);
  const found = PERIODS.find(([, from, to]) => md >= from && md <= to);
  return found ? SEASONS[found[0]] : null;
}

/** Message d'accueil de l'écran Sorties */
export function seasonalGreeting(pseudo: string, season: Season | null, date = new Date()) {
  const md = dayKey(date).slice(5);
  const hour = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(date));
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Salut";

  switch (season?.key) {
    case "halloween":
      return md === "10-31" ? `Joyeux Halloween ${pseudo} 🎃` : `Bouh ${pseudo} 👻`;
    case "noel":
      return md === "12-24" || md === "12-25" ? `Joyeux Noël ${pseudo} 🎄` : `${hello} ${pseudo} 🎄`;
    case "nouvel-an":
      return md.startsWith("01-") ? `Bonne année ${pseudo} 🥂` : `${hello} ${pseudo} 🥂`;
    case "ete":
      return `${hello} ${pseudo} ☀️`;
    default:
      return `${hello} ${pseudo} 👋`;
  }
}

/** Cookie posé quand quelqu'un coupe les décorations depuis son profil */
export const DECO_COOKIE = "deco";
