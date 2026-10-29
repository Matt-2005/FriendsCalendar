import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireMe } from "@/lib/session";
import { getEvent, getPlaceSuggestions } from "@/lib/queries";
import { toInputs } from "@/lib/dates";
import EventForm from "../../_components/EventForm";

export const metadata: Metadata = { title: "Modifier la sortie" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMe();
  const id = Number((await params).id);
  const event = await getEvent(me, id);
  if (!event) notFound();
  const places = await getPlaceSuggestions(me.id, event.groupId);
  if (!event.canManage) redirect(`/events/${id}`);

  const s = toInputs(event.start);
  const e = event.end ? toInputs(event.end) : null;

  return (
    <main className="page">
      <Link href={`/events/${id}`} className="back-link">
        ‹ Retour
      </Link>
      <header className="page-header" style={{ marginTop: 4 }}>
        <h1 className="page-title">Modifier la sortie</h1>
      </header>
      <EventForm
        eventId={id}
        places={places}
        initial={{
          title: event.title,
          date: s.date,
          time: s.time,
          endDate: e?.date ?? "",
          endTime: e?.time ?? "",
          location: event.location,
          description: event.description,
        }}
      />
    </main>
  );
}
