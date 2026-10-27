"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import styles from "../auth.module.css";
import { errorMessage } from "@/lib/errors";
import GoogleButton, { OrSeparator } from "../components/GoogleButton";

export default function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");

      // Connexion automatique : pas besoin de retaper ses identifiants
      const login = await signIn("credentials", { email: email.trim(), password, redirect: false });
      window.location.href = login?.error ? `/login?email=${encodeURIComponent(email.trim())}` : "/events";
    } catch (e) {
      setErr(errorMessage(e, "Erreur serveur, réessaie"));
      setLoading(false);
    }
  }

  return (
    <main className={styles.screen}>
      <Link href="/" className={`back-link ${styles.back}`}>
        ‹ Retour
      </Link>
      <div className={styles.box}>
        <div className={styles.logo}>
          <img src="/logoCalendrier.png" alt="" />
        </div>
        <h1 className={styles.title}>Bienvenue dans la bande</h1>
        <p className={styles.subtitle}>Crée ton compte en 20 secondes.</p>

        <form onSubmit={onSubmit} className={styles.card}>
          {googleEnabled && (
            <>
              <GoogleButton callbackUrl="/events" label="S'inscrire avec Google" />
              <OrSeparator />
            </>
          )}
          <div className="field">
            <label htmlFor="pseudo" className="label">Ton prénom ou surnom</label>
            <input
              id="pseudo"
              className="input"
              placeholder="Ex : Léa"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              autoComplete="given-name"
              maxLength={40}
              enterKeyHint="next"
              required
            />
            <span className="hint">C'est ce que les autres verront.</span>
          </div>
          <div className="field">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="toi@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              enterKeyHint="next"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password" className="label">Mot de passe</label>
            <div className="input-wrap">
              <input
                id="password"
                type={show ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                enterKeyHint="go"
                required
              />
              <button type="button" className="input-action" onClick={() => setShow((s) => !s)}>
                {show ? "Cacher" : "Voir"}
              </button>
            </div>
            <span className="hint">8 caractères minimum</span>
          </div>

          {err && <div className="alert alert-error" style={{ marginTop: 14 }}>⚠️ {err}</div>}

          <button
            type="submit"
            disabled={loading || !pseudo.trim() || !email || password.length < 8}
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: 18 }}
          >
            {loading ? <span className="spinner" /> : "C'est parti !"}
          </button>
        </form>

        <p className={styles.footer}>
          Déjà un compte ? <Link href="/login">Connecte-toi</Link>
        </p>
      </div>
    </main>
  );
}
