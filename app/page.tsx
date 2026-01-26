import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <Image
            src="/logoCalendrier.png"
            alt="Logo"
            width={80}
            height={80}
            className={styles.logo}
          />
        </div>

        <h1 className={styles.title}>FriendsCalendar</h1>
        <p className={styles.subtitle}>
          Partagez vos moments avec vos amis.<br />
          Organisez vos événements simplement.
        </p>

        <div className={styles.buttonGroup}>
          <Link href="/login" className={styles.primaryButton}>
            Se connecter
          </Link>
          <Link href="/register" className={styles.secondaryButton}>
            Créer un compte
          </Link>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📅</div>
            <h3>Calendrier partagé</h3>
            <p>Créez et partagez des événements avec vos amis</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔔</div>
            <h3>Notifications</h3>
            <p>Restez informé des nouveaux événements</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>✅</div>
            <h3>RSVP facile</h3>
            <p>Confirmez votre présence en un clic</p>
          </div>
        </div>
      </div>
    </div>
  );
}
