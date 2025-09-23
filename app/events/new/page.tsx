// app/events/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import NewEventForm from "./NewEventForm";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent("/events/new")}`);

  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Nouvel évènement</h1>
      <NewEventForm />
    </div>
  );
}
