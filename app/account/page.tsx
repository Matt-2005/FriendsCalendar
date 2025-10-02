// app/account/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import AccountForm from "./AccountForm";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, pseudo: true, avatarUrl: true, calendarToken: true },
  });
  if (!user) return null;

  const httpsUrl = `https://lesindeciscalendar.fr/api/ical/${user.calendarToken}.ics`;
  const webcalUrl = `webcal://lesindeciscalendar.fr/api/ical/${user.calendarToken}.ics`;

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 640, margin: "0 auto" }}>
      <h2>Mon compte</h2>

      <section style={{ display: "grid", gap: 12 }}>
        <h3>Abonnement à mon calendrier</h3>
        <div><b>Apple/Outlook :</b> <a href={webcalUrl}>{webcalUrl}</a></div>
        <div>
          <b>Google :</b> Autres agendas → S’abonner → coller :<br />
          <code>{httpsUrl}</code>
        </div>
        <form action="/api/account/regenerate-calendar-token" method="post">
          <button type="submit">Régénérer le lien (invalide l’ancien)</button>
        </form>
      </section>

      <AccountForm
        initialEmail={user.email}
        initialPseudo={user.pseudo}
        initialAvatarUrl={user.avatarUrl ?? ""}
      />
    </div>
  );
}
