import Link from "next/link";
import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { getPlaceSuggestions } from "@/lib/queries";
import EventForm from "../_components/EventForm";

export const metadata: Metadata = { title: "Proposer une sortie" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const me = await requireMe();
  const { date } = await searchParams;
  const initialDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  const places = await getPlaceSuggestions(me.id);

  return (
    <main className="page">
      <Link href="/events" className="back-link">
        ‹ Annuler
      </Link>
      <header className="page-header" style={{ marginTop: 4 }}>
        <div>
          <h1 className="page-title">Proposer une sortie</h1>
          <p className="page-subtitle">Trois infos et c'est parti.</p>
        </div>
      </header>
      <EventForm initial={{ date: initialDate }} places={places} />
    </main>
  );
}
