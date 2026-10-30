import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";
import styles from "./auth.module.css";

export default async function Home() {
  if (await getMe()) redirect("/events");

  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.logo}>
          <img src="/logoCalendrier.png" alt="" />
        </div>
        <h1 className={styles.title}>Ziva</h1>
        <p className={styles.subtitle}>Les sorties de ta bande, enfin calées. Sans prise de tête.</p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureEmoji}>🍻</span>
            <div>
              Propose une sortie en 30 secondes
              <div className={styles.featureText}>Tout le monde est prévenu sur son téléphone</div>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureEmoji}>👍</span>
            <div>
              Réponds en un geste
              <div className={styles.featureText}>J'y vais, peut-être ou pas dispo</div>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureEmoji}>📅</span>
            <div>
              Trouve le bon jour
              <div className={styles.featureText}>Vois qui est dispo, et quand</div>
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <Link href="/register" className="btn btn-primary btn-lg btn-block">
            Créer mon compte
          </Link>
          <Link href="/login" className="btn btn-outline btn-lg btn-block">
            J'ai déjà un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
