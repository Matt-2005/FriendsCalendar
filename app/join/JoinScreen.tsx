"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "../auth.module.css";

type Pending = { groupId: number; name: string };

/** Entrer un code de groupe, et suivre ses demandes en attente */
export default function JoinScreen({
  pseudo,
  pending,
  hasGroup,
  initialCode = "",
  inviteGroupName,
  alreadyMember = false,
}: {
  pseudo: string;
  pending: Pending[];
  hasGroup: boolean;
  initialCode?: string;
  /** Arrivé par un lien d'invitation valide */
  inviteGroupName?: string;
  /** Déjà membre du groupe de l'invitation */
  alreadyMember?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function join(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setBusy(false);
      return setErr(res?.status === 429 ? "Trop d'essais. Réessaie dans un moment." : j?.error ?? "Erreur, réessaie");
    }
    if (j.status === "ACTIVE") {
      window.location.href = "/events";
      return;
    }
    // Demande envoyée : on affiche l'attente
    setBusy(false);
    setCode("");
    window.location.href = "/join";
  }

  async function cancel(groupId: number) {
    await fetch(`/api/groups/join?groupId=${groupId}`, { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  function refresh() {
    setRefreshing(true);
    // Rechargement complet : si la demande vient d'être acceptée, on bascule sur l'appli
    window.location.href = hasGroup ? "/join" : "/events";
  }

  const waiting = pending.length > 0 && !inviteGroupName;

  return (
    <main className={styles.screen}>
      {hasGroup && (
        <Link href="/account" className={`back-link ${styles.back}`}>
          ‹ Retour
        </Link>
      )}
      <div className={styles.box}>
        <div className={styles.logo}>
          <img src="/logoCalendrier.png" alt="" />
        </div>

        {waiting ? (
          <>
            <h1 className={styles.title}>Demande envoyée ⏳</h1>
            <p className={styles.subtitle}>
              Un admin du groupe doit accepter ta demande. Tu recevras une notification dès que c'est bon.
            </p>
            <div className={styles.card}>
              <div className="stack" style={{ gap: 10 }}>
                {pending.map((p) => (
                  <div key={p.groupId} className="row" style={{ gap: 10 }}>
                    <span className="group-avatar" aria-hidden>
                      {p.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="grow">
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div className="small muted">En attente de validation</div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => cancel(p.groupId)}>
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} onClick={refresh} disabled={refreshing}>
                {refreshing ? <span className="spinner" /> : "↻ C'est accepté ?"}
              </button>
            </div>
            <details className="details" style={{ marginTop: 16 }}>
              <summary>J'ai un autre code</summary>
              <CodeForm code={code} setCode={setCode} onSubmit={join} busy={busy} err={err} />
            </details>
          </>
        ) : (
          <>
            <h1 className={styles.title}>
              {inviteGroupName ? `Rejoins ${inviteGroupName}` : hasGroup ? "Rejoindre un groupe" : `Salut ${pseudo} 👋`}
            </h1>
            <p className={styles.subtitle}>
              {inviteGroupName
                ? alreadyMember
                  ? "Tu fais déjà partie de ce groupe."
                  : "Un admin du groupe validera ta demande, puis tu verras toutes les sorties."
                : "Entre le code du groupe que t'a donné l'organisateur."}
            </p>
            <div className={styles.card}>
              {inviteGroupName ? (
                <>
                  {err && <div className="alert alert-error" style={{ marginBottom: 14 }}>⚠️ {err}</div>}
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => join()} disabled={busy}>
                    {busy ? <span className="spinner" /> : alreadyMember ? `Ouvrir ${inviteGroupName}` : `Demander à rejoindre ${inviteGroupName}`}
                  </button>
                </>
              ) : (
                <CodeForm code={code} setCode={setCode} onSubmit={join} busy={busy} err={err} />
              )}
            </div>
          </>
        )}

        {!hasGroup && (
          <p className={styles.footer}>
            Pas le bon compte ?{" "}
            <button type="button" className="link-button" onClick={() => signOut({ callbackUrl: "/" })}>
              Me déconnecter
            </button>
          </p>
        )}
      </div>
    </main>
  );
}

function CodeForm({
  code,
  setCode,
  onSubmit,
  busy,
  err,
}: {
  code: string;
  setCode: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  err: string | null;
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="code" className="label">Code du groupe</label>
        <input
          id="code"
          className="input code-input"
          placeholder="ABC123"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={16}
          enterKeyHint="go"
          required
        />
      </div>
      {err && <div className="alert alert-error" style={{ marginTop: 14 }}>⚠️ {err}</div>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} disabled={busy || code.trim().length < 4}>
        {busy ? <span className="spinner" /> : "Rejoindre"}
      </button>
    </form>
  );
}
