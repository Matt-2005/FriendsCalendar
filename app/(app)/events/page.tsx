import Link from "next/link";
import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { getPastEvents, getUpcomingEvents, type EventVM } from "@/lib/queries";
import EventCard from "./_components/EventCard";
import Avatar from "../../components/Avatar";
import NotificationsCard from "../../components/NotificationsCard";
import RefreshButton from "../../components/RefreshButton";
import { fmtTime } from "@/lib/dates";
import { currentSeason, seasonalGreeting } from "@/lib/season";

export const metadata: Metadata = { title: "Sorties" };

const FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "todo", label: "À répondre" },
  { key: "going", label: "J'y vais" },
  { key: "mine", label: "Mes sorties" },
  { key: "past", label: "Passées" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const me = await requireMe();
  const { f } = await searchParams;
  const filter: FilterKey = FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "all";

  const upcoming = await getUpcomingEvents(me);
  const todoCount = upcoming.filter((e) => e.myStatus === null).length;

  let list: EventVM[];
  if (filter === "past") list = await getPastEvents(me);
  else if (filter === "todo") list = upcoming.filter((e) => e.myStatus === null);
  else if (filter === "going") list = upcoming.filter((e) => e.myStatus === "YES" || e.myStatus === "MAYBE");
  else if (filter === "mine") list = upcoming.filter((e) => e.creator.id === me.id);
  else list = upcoming;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            {seasonalGreeting(me.pseudo, currentSeason())}
          </h1>
          <p className="page-subtitle">
            {upcoming.length === 0
              ? "Aucune sortie prévue pour l'instant"
              : todoCount > 0
                ? `${todoCount} sortie${todoCount > 1 ? "s" : ""} attend${todoCount > 1 ? "ent" : ""} ta réponse`
                : `${upcoming.length} sortie${upcoming.length > 1 ? "s" : ""} à venir`}
          </p>
        </div>
        <Link href="/account" aria-label="Mon profil">
          <Avatar user={me} size={44} />
        </Link>
      </header>

      {!me.simulatedBy && <NotificationsCard />}

      <nav className="chips" style={{ margin: "18px -16px 16px", padding: "2px 16px" }} aria-label="Filtrer">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={x.key === "all" ? "/events" : `/events?f=${x.key}`}
            className={`chip ${filter === x.key ? "is-active" : ""}`}
            aria-current={filter === x.key ? "page" : undefined}
            scroll={false}
          >
            {x.label}
            {x.key === "todo" && todoCount > 0 && <span className="chip-count">{todoCount}</span>}
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="stack">
          {list.map((e) => (
            <EventCard key={e.id} event={e} past={filter === "past"} />
          ))}
        </div>
      )}

      <RefreshButton updatedAt={fmtTime(new Date())} />
    </main>
  );
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const content: Record<FilterKey, [string, string, string]> = {
    all: ["🦗", "C'est calme par ici…", "Lance la première sortie, les autres suivront !"],
    todo: ["✅", "Tu as répondu à tout", "Bravo, rien en attente."],
    going: ["🛋️", "Rien de prévu pour toi", "Jette un œil aux sorties proposées par les potes."],
    mine: ["💡", "Tu n'as rien organisé", "Une idée de sortie ? Propose-la en 30 secondes."],
    past: ["📼", "Pas encore de souvenirs", "Les sorties terminées apparaîtront ici."],
  };
  const [emoji, title, text] = content[filter];
  return (
    <div className="empty">
      <div className="empty-emoji">{emoji}</div>
      <p className="empty-title">{title}</p>
      <p className="empty-text">{text}</p>
      {filter !== "todo" && filter !== "past" && (
        <Link href="/events/new" className="btn btn-primary">
          Proposer une sortie
        </Link>
      )}
    </div>
  );
}
