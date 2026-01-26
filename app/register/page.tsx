"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./register.module.css";

export default function RegisterPage() {
  const r = useRouter();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo, email, password }),
      });

      if (res.ok) {
        r.push("/login");
        return;
      }

      // On tente de récupérer un message JSON
      const data = await res.json().catch(() => ({} as any));

      if (res.status === 409) setErr(data.error ?? "Email déjà utilisé");
      else if (res.status === 400) setErr(data.error ?? "Entrées invalides");
      else setErr(data.error ?? "Erreur serveur");
    } catch {
      setErr("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
      </div>

      <div className={styles.formCard}>
        <Link href="/" className={styles.backButton}>
          ← Retour
        </Link>

        <div className={styles.logoContainer}>
          <Image
            src="/logoCalendrier.png"
            alt="Logo"
            width={60}
            height={60}
            className={styles.logo}
          />
        </div>

        <h1 className={styles.title}>Inscription</h1>
        <p className={styles.subtitle}>
          Créez votre compte pour commencer à partager vos événements.
        </p>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="pseudo" className={styles.label}>
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              placeholder="VotrePseudo"
              value={pseudo}
              onChange={e => setPseudo(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input}
              required
              minLength={6}
            />
            <span className={styles.hint}>Minimum 6 caractères</span>
          </div>

          {err && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Déjà un compte ?{" "}
            <Link href="/login" className={styles.link}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
