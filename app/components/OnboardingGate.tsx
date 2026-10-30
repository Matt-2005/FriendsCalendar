"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { enablePush, getPushState, isIOS, isStandalone, type PushState } from "./pushClient";
import styles from "./onboarding.module.css";

type Step = "loading" | "install" | "notif" | "done";

const SKIP_INSTALL = "skip-install";
const SKIP_NOTIF = "skip-notif";

function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || isIOS();
}

/** Navigateurs intégrés (Instagram, Facebook, Snapchat…) qui ne permettent pas l'installation */
function isInAppBrowser() {
  return /FBAN|FBAV|Instagram|Line\/|Snapchat|GSA\/|LinkedInApp|TikTok/i.test(navigator.userAgent);
}

const read = (k: string) => {
  try {
    return sessionStorage.getItem(k) === "1";
  } catch {
    return false;
  }
};
const write = (k: string) => {
  try {
    sessionStorage.setItem(k, "1");
  } catch {
    /* navigation privée */
  }
};

/**
 * Écran obligatoire au lancement :
 * 1. Sur téléphone, il faut installer l'app sur l'écran d'accueil
 * 2. Une fois connecté, il faut activer les notifications
 */
export default function OnboardingGate() {
  const { status } = useSession();
  const [step, setStep] = useState<Step>("loading");
  const [push, setPush] = useState<PushState>("loading");

  const evaluate = useCallback(async () => {
    if (isMobile() && !isStandalone() && !read(SKIP_INSTALL)) return setStep("install");
    if (status !== "authenticated") return setStep(status === "loading" ? "loading" : "done");
    const s = await getPushState().catch(() => "unsupported" as PushState);
    setPush(s);
    setStep((s === "off" || s === "denied") && !read(SKIP_NOTIF) ? "notif" : "done");
  }, [status]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  // Empêche de faire défiler l'app derrière l'écran
  useEffect(() => {
    if (step !== "install" && step !== "notif") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  if (step === "install")
    return (
      <InstallScreen
        onSkip={() => {
          write(SKIP_INSTALL);
          evaluate();
        }}
      />
    );
  if (step === "notif")
    return (
      <NotifScreen
        initial={push}
        onDone={() => setStep("done")}
        onSkip={() => {
          write(SKIP_NOTIF);
          setStep("done");
        }}
      />
    );
  return null;
}

/* ------------------------------------------------------------------ */

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);
const AddIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

function InstallScreen({ onSkip }: { onSkip: () => void }) {
  const ios = isIOS();
  const inApp = isInAppBrowser();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") setInstalled(true);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
    } catch {
      /* rien */
    }
  }

  return (
    <div className={styles.screen} role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div className={styles.inner}>
        <div className={styles.logo}>
          <img src="/icon-192.png" alt="" />
        </div>
        <p className={styles.kicker}>Étape 1 sur 2</p>
        <h1 id="onb-title" className={styles.title}>
          Installe l'app sur ton téléphone
        </h1>
        <p className={styles.text}>
          C'est <strong>indispensable</strong> pour recevoir les notifications des sorties. Ça prend 10 secondes, et l'app
          s'ouvrira ensuite comme une vraie appli 📲
        </p>

        {installed ? (
          <div className={styles.success}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <strong>C'est installé !</strong>
            <p>Ferme cette page et ouvre <strong>Ziva</strong> depuis ton écran d'accueil.</p>
          </div>
        ) : inApp ? (
          <div className={styles.card}>
            <p>
              Tu es dans le navigateur d'une autre appli. Ouvre ce lien dans <strong>{ios ? "Safari" : "Chrome"}</strong> :
            </p>
            <ol className={styles.steps}>
              <li>
                Touche <strong>⋯</strong> en haut ou en bas de l'écran
              </li>
              <li>
                Choisis <strong>« Ouvrir dans {ios ? "Safari" : "le navigateur"} »</strong>
              </li>
            </ol>
            <button type="button" className="btn btn-outline btn-block" onClick={copyLink}>
              {copied ? "Lien copié ✓ colle-le dans " + (ios ? "Safari" : "Chrome") : "Copier le lien"}
            </button>
          </div>
        ) : ios ? (
          <div className={styles.card}>
            <ol className={styles.steps}>
              <li>
                Touche le bouton <span className={styles.pill}><ShareIcon /> Partager</span>
                <span className={styles.sub}>Sur les iPhone récents, touche d'abord <strong>⋯</strong> en bas à droite.</span>
              </li>
              <li>
                Fais défiler et touche <span className={styles.pill}><AddIcon /> Sur l'écran d'accueil</span>
              </li>
              <li>
                Touche <strong>Ajouter</strong> en haut à droite
              </li>
              <li>
                Ouvre <strong>Ziva</strong> depuis ton écran d'accueil
                <span className={styles.sub}>Tu devras te reconnecter une fois dans l'app, c'est normal.</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className={styles.card}>
            {prompt ? (
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={install}>
                📲 Installer l'app
              </button>
            ) : (
              <ol className={styles.steps}>
                <li>
                  Touche <strong>⋮</strong> en haut à droite de Chrome
                </li>
                <li>
                  Choisis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>
                </li>
                <li>
                  Ouvre <strong>Ziva</strong> depuis ton écran d'accueil
                </li>
              </ol>
            )}
          </div>
        )}

        <div className={styles.footer}>
          {help ? (
            <button type="button" className={styles.skip} onClick={onSkip}>
              Continuer dans le navigateur (sans notifications)
            </button>
          ) : (
            <button type="button" className={styles.skip} onClick={() => setHelp(true)}>
              Je n'y arrive pas
            </button>
          )}
        </div>
      </div>
      {ios && !inApp && !installed && <div className={styles.arrow} aria-hidden>↓</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NotifScreen({ initial, onDone, onSkip }: { initial: PushState; onDone: () => void; onSkip: () => void }) {
  const [state, setState] = useState<PushState>(initial);
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [success, setSuccess] = useState(false);
  const desktop = !isMobile();

  async function activate() {
    setBusy(true);
    try {
      const s = await enablePush();
      setState(s);
      setTries((t) => t + 1);
      if (s === "on") {
        await fetch("/api/push/test", { method: "POST" }).catch(() => {});
        setSuccess(true);
        setTimeout(onDone, 1600);
      }
    } catch {
      setTries((t) => t + 1);
    } finally {
      setBusy(false);
    }
  }

  async function recheck() {
    const s = await getPushState();
    setState(s);
    if (s === "off") activate();
  }

  return (
    <div className={styles.screen} role="dialog" aria-modal="true" aria-labelledby="notif-title">
      <div className={styles.inner}>
        <div className={styles.bell} aria-hidden>
          🔔
        </div>
        <p className={styles.kicker}>{desktop ? "Une dernière chose" : "Étape 2 sur 2"}</p>
        <h1 id="notif-title" className={styles.title}>
          Active les notifications
        </h1>
        <p className={styles.text}>
          Sans elles, tu vas <strong>rater les sorties</strong> 😱 On ne t'embête pas : seulement quand ça compte.
        </p>

        <ul className={styles.perks}>
          <li>🍻 Un pote propose une sortie</li>
          <li>✏️ Une sortie change d'heure ou de lieu</li>
          <li>⏰ Le rappel le jour J</li>
          <li>👀 La relance si tu n'as pas répondu</li>
        </ul>

        {success ? (
          <div className={styles.success}>
            <div style={{ fontSize: 40 }}>✅</div>
            <strong>Parfait, c'est activé !</strong>
          </div>
        ) : state === "denied" ? (
          <div className={styles.card}>
            <p>
              <strong>Les notifications sont bloquées.</strong> Pour les réactiver :
            </p>
            <ol className={styles.steps}>
              {isIOS() ? (
                <>
                  <li>Ouvre les <strong>Réglages</strong> de l'iPhone</li>
                  <li>
                    <strong>Notifications</strong> → <strong>Ziva</strong>
                  </li>
                  <li>
                    Active <strong>« Autoriser les notifications »</strong>
                  </li>
                </>
              ) : (
                <>
                  <li>Appui long sur l'icône <strong>Ziva</strong> → <strong>Infos sur l'appli</strong></li>
                  <li>
                    <strong>Notifications</strong> → active-les
                  </li>
                </>
              )}
            </ol>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={recheck}>
              C'est fait, vérifier
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={activate} disabled={busy}>
            {busy ? <span className="spinner" /> : "🔔 Activer les notifications"}
          </button>
        )}

        {!success && (
          <p className={styles.hint}>
            {state === "denied" ? "" : "Ton téléphone va te demander l'autorisation : touche « Autoriser »."}
          </p>
        )}

        {!success && (desktop || tries > 0 || state === "denied") && (
          <div className={styles.footer}>
            <button type="button" className={styles.skip} onClick={onSkip}>
              Plus tard (je risque de rater des sorties)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
