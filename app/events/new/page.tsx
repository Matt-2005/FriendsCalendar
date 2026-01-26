// app/events/new/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import NewEventForm from "./NewEventForm";
import Link from "next/link";
import styles from "./newevent.module.css";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    redirect(`/login?callbackUrl=${encodeURIComponent("/events/new")}`);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/events" className={styles.backLink}>
            ← Retour aux événements
          </Link>
          <h1 className={styles.pageTitle}>Créer un événement</h1>
          <p className={styles.pageSubtitle}>
            Organisez un nouvel événement et invitez vos amis
          </p>
        </div>
        <NewEventForm />
      </div>
    </div>
  );
}
