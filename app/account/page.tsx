// app/account/page.tsx (extrait server)
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { calendarToken: true },
  });

  const httpsUrl = `https://ton-domaine.fr/api/ical/${user!.calendarToken}.ics`;
  const webcalUrl = `webcal://ton-domaine.fr/api/ical/${user!.calendarToken}.ics`;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>Mon calendrier externe</h2>
      <div>
        <div>
          <b>Apple/Outlook :</b> <a href={webcalUrl}>{webcalUrl}</a>
        </div>
        <div>
          <b>Google :</b> ouvrir Google Calendar → “Autres agendas” → “S’abonner à l’agenda” → coller :<br/>
          <code>{httpsUrl}</code>
        </div>
      </div>
      {/* bouton pour régénérer */}
      <form action={`/api/account/regenerate-calendar-token`} method="post">
        <button type="submit">Régénérer le lien (invalider l’ancien)</button>
      </form>
    </div>
  );
}
