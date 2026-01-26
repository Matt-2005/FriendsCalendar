"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); 
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (res?.error) setErr("Email ou mot de passe invalide");
    else r.push(callbackUrl);
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

        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.subtitle}>
          Bienvenue ! Connectez-vous pour accéder à votre calendrier.
        </p>

        <form onSubmit={onSubmit} className={styles.form}>
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
            />
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
              "Se connecter"
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Pas encore de compte ?{" "}
            <Link href="/register" className={styles.link}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
