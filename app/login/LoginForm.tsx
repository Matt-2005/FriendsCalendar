"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import styles from "../auth.module.css";
import GoogleButton, { OrSeparator } from "../components/GoogleButton";

export default function LoginForm({
  callbackUrl,
  initialEmail,
  googleEnabled,
  initialError,
}: {
  callbackUrl: string;
  initialEmail: string;
  googleEnabled: boolean;
  initialError: string | null;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email: email.trim(), password, redirect: false }).catch(() => null);
    if (!res || res.error) {
      setLoading(false);
      setErr(
        res
          ? googleEnabled
            ? "Email ou mot de passe incorrect. Si tu t'es inscrit avec Google, utilise le bouton Google."
            : "Email ou mot de passe incorrect"
          : "Pas de connexion internet"
      );
      return;
    }
    // Rechargement complet pour repartir avec une session propre
    window.location.href = callbackUrl;
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
        <h1 className={styles.title}>Content de te revoir</h1>
        <p className={styles.subtitle}>Connecte-toi pour voir les prochaines sorties.</p>

        <form onSubmit={onSubmit} className={styles.card}>
          {googleEnabled && (
            <>
              <GoogleButton callbackUrl={callbackUrl} />
              <OrSeparator />
            </>
          )}
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
                autoComplete="current-password"
                enterKeyHint="go"
                required
              />
              <button type="button" className="input-action" onClick={() => setShow((s) => !s)}>
                {show ? "Cacher" : "Voir"}
              </button>
            </div>
          </div>

          {err && <div className="alert alert-error" style={{ marginTop: 14 }}>⚠️ {err}</div>}

          <button type="submit" disabled={loading || !email || !password} className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }}>
            {loading ? <span className="spinner" /> : "Se connecter"}
          </button>

          <button type="button" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 8 }} onClick={() => setForgot((f) => !f)}>
            Mot de passe oublié ?
          </button>
          {forgot && (
            <p className="alert alert-info" style={{ marginTop: 6 }}>
              Demande à l'admin du groupe : il peut te créer un mot de passe provisoire depuis son profil.
            </p>
          )}
        </form>

        <p className={styles.footer}>
          Pas encore de compte ? <Link href="/register">Inscris-toi</Link>
        </p>
      </div>
    </main>
  );
}
