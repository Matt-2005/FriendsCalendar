// app/events/page.tsx  — Server Component
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import styles from "./page.module.css";

function fmt(d: Date) {
  // Affichage simple (locale FR)
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default async function EventsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.containerEvents}>

      </div>
      <div className={styles.calendar}>

      </div>

    </div>
  );
}
