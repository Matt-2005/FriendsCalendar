"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, getPushState, isIOS, type PushState } from "./pushClient";

const DISMISS_KEY = "notif-card-dismissed";

function IosInstallSteps() {
  return (
    <ol className="steps">
      <li>
        Appuie sur <strong>Partager</strong>{" "}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", verticalAlign: "-3px" }}>
          <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>{" "}
        en bas de Safari
      </li>
      <li>
        Choisis <strong>« Sur l'écran d'accueil »</strong>
      </li>
      <li>
        Ouvre l'app <strong>Les Indécis</strong> depuis ton écran d'accueil et reviens ici
      </li>
    </ol>
  );
}

/**
 * variant="banner" : carte sur l'accueil, masquable
 * variant="settings" : bloc complet dans le profil
 */
export default function NotificationsCard({ variant = "banner" }: { variant?: "banner" | "settings" }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [installEvent, setInstallEvent] = useState<any>(null);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
    setDismissed(variant === "banner" && localStorage.getItem(DISMISS_KEY) === "1");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [variant]);

  async function turnOn() {
    setBusy(true);
    setMsg(null);
    try {
      const s = await enablePush();
      setState(s);
      if (s === "on") {
        await fetch("/api/push/test", { method: "POST" });
        setMsg("C'est activé ! Tu devrais recevoir une notification de test.");
      }
    } catch {
      setMsg("Ça n'a pas marché, réessaie dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setState(await disablePush());
    setBusy(false);
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    setMsg(res.ok ? "Notification envoyée 📬" : "Échec de l'envoi");
    setBusy(false);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (state === "loading") return null;

  if (variant === "banner") {
    if (dismissed || state === "on" || state === "unsupported" || state === "not-configured" || state === "denied") return null;
    return (
      <div className="card notif-banner">
        <button type="button" className="notif-dismiss" onClick={dismiss} aria-label="Masquer">
          ✕
        </button>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="notif-emoji">🔔</div>
          <div className="grow">
            <div className="card-title">Ne rate plus aucune sortie</div>
            {state === "ios-install" ? (
              <>
                <p className="card-text">Sur iPhone, ajoute d'abord l'app à ton écran d'accueil pour recevoir les notifications :</p>
                <IosInstallSteps />
              </>
            ) : (
              <p className="card-text">Reçois une notification quand un pote propose une sortie, et un rappel le jour J.</p>
            )}
          </div>
        </div>
        {state === "off" && (
          <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={turnOn} disabled={busy}>
            {busy ? <span className="spinner" /> : "Activer les notifications"}
          </button>
        )}
        {installEvent && (
          <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 8 }} onClick={() => installEvent.prompt()}>
            📲 Installer l'app sur mon téléphone
          </button>
        )}
        {msg && <p className="hint" style={{ marginTop: 8 }}>{msg}</p>}
      </div>
    );
  }

  // Version complète (profil)
  return (
    <div className="stack">
      {state === "on" && (
        <>
          <div className="alert alert-success">✅ Notifications activées sur cet appareil</div>
          <div className="grid-2">
            <button type="button" className="btn btn-outline" onClick={test} disabled={busy}>
              Tester
            </button>
            <button type="button" className="btn btn-outline" onClick={turnOff} disabled={busy}>
              Désactiver
            </button>
          </div>
        </>
      )}
      {state === "off" && (
        <button type="button" className="btn btn-primary btn-block" onClick={turnOn} disabled={busy}>
          {busy ? <span className="spinner" /> : "🔔 Activer les notifications"}
        </button>
      )}
      {state === "ios-install" && (
        <>
          <p className="card-text">Sur iPhone, les notifications marchent une fois l'app ajoutée à l'écran d'accueil :</p>
          <IosInstallSteps />
        </>
      )}
      {state === "denied" && (
        <div className="alert alert-info">
          Les notifications sont bloquées.{" "}
          {isIOS()
            ? "Va dans Réglages → Notifications → Les Indécis, et active « Autoriser les notifications »."
            : "Appuie sur le cadenas à côté de l'adresse du site, puis autorise les notifications."}
        </div>
      )}
      {state === "unsupported" && (
        <div className="alert alert-info">Ce navigateur ne gère pas les notifications. Essaie avec Chrome (Android) ou Safari (iPhone).</div>
      )}
      {state === "not-configured" && (
        <div className="alert alert-info">Les notifications ne sont pas encore configurées sur le serveur.</div>
      )}
      {installEvent && (
        <button type="button" className="btn btn-secondary btn-block" onClick={() => installEvent.prompt()}>
          📲 Installer l'app sur mon téléphone
        </button>
      )}
      {msg && <p className="hint">{msg}</p>}
    </div>
  );
}
