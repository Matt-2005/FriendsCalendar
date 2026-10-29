"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useToast } from "../../components/Toast";

type Platform = "ios" | "android" | "other";

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

export default function CalendarSync({ baseUrl, initialToken }: { baseUrl: string; initialToken: string }) {
  const toast = useToast();
  const [token, setToken] = useState(initialToken);
  const [tab, setTab] = useState<Platform>("ios");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setTab(detect()), []);

  const httpsUrl = `${baseUrl}/api/ical/${token}.ics`;
  const webcalUrl = httpsUrl.replace(/^https?:/, "webcal:");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(httpsUrl);
      toast("Lien copié 📋");
    } catch {
      toast("Copie impossible, sélectionne le lien à la main");
    }
  }

  async function regenerate() {
    setBusy(true);
    const res = await fetch("/api/account/regenerate-calendar-token", { method: "POST" }).catch(() => null);
    setBusy(false);
    setConfirm(false);
    if (!res?.ok) return toast("Échec, réessaie");
    setToken((await res.json()).calendarToken);
    toast("Nouveau lien créé. Réabonne-toi avec le bouton ci-dessus.");
  }

  return (
    <div className="card">
      <p className="card-text">
        Toutes les sorties de ton groupe apparaissent automatiquement dans le calendrier de ton téléphone, à côté de tes rendez-vous.
        Celles que tu refuses disparaissent toutes seules.
      </p>

      <div className="chips" style={{ margin: "14px 0" }} role="tablist">
        {([
          ["ios", "🍎 iPhone"],
          ["android", "🤖 Android"],
          ["other", "💻 Autre"],
        ] as const).map(([k, label]) => (
          <button key={k} type="button" role="tab" className="chip" aria-selected={tab === k} aria-pressed={undefined} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "ios" && (
        <>
          <a href={webcalUrl} className="btn btn-primary btn-block btn-lg">
            Ajouter à mon calendrier iPhone
          </a>
          <ol className="steps">
            <li>Touche le bouton ci-dessus</li>
            <li>
              Touche <strong>« S'abonner »</strong>, puis <strong>« Ajouter »</strong>
            </li>
            <li>C'est fini ! Les sorties apparaissent dans l'app Calendrier 🎉</li>
          </ol>
          <details className="details">
            <summary>Recevoir les rappels du calendrier</summary>
            <p>
              Par défaut l'iPhone ignore les alertes des calendriers abonnés. Pour les garder : <strong>Réglages → Calendrier → Comptes → Calendriers avec abonnement → Les Indécis</strong>, puis désactive « Supprimer les alarmes ».
            </p>
          </details>
        </>
      )}

      {tab === "android" && (
        <>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block btn-lg">
            Ajouter à Google Agenda
          </a>
          <ol className="steps">
            <li>Touche le bouton, connecte-toi à ton compte Google si besoin</li>
            <li>
              Confirme avec <strong>« Ajouter »</strong>
            </li>
            <li>
              Dans l'app Google Agenda : <strong>Menu ☰ → Paramètres → Les Indécis</strong> → active <strong>« Synchroniser »</strong>
            </li>
          </ol>
          <details className="details">
            <summary>Ça ne marche pas sur mon téléphone ?</summary>
            <p>
              Google n'accepte parfois l'ajout que depuis un ordinateur. Copie le lien ci-dessous, ouvre <strong>calendar.google.com</strong> sur un ordinateur → « Autres agendas » → « + » → « À partir de l'URL » et colle-le. Google met parfois quelques heures à afficher les nouveautés.
            </p>
          </details>
        </>
      )}

      {tab === "other" && (
        <p className="card-text">
          Dans Outlook, Thunderbird, ou l'app Calendrier du Mac, choisis « S'abonner à un calendrier » / « Ajouter un calendrier depuis Internet » et colle ce lien :
        </p>
      )}

      <div className="field" style={{ marginTop: 16 }}>
        <span className="label">Mon lien personnel</span>
        <div className="input-wrap">
          <input className="input" readOnly value={httpsUrl} onFocus={(e) => e.target.select()} style={{ fontSize: 13, paddingRight: 84 }} />
          <button type="button" className="input-action" onClick={copy}>
            Copier
          </button>
        </div>
        <span className="hint">Ce lien est personnel : ne le partage pas.</span>
      </div>

      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10, paddingInline: 0 }} onClick={() => setConfirm(true)}>
        🔄 Créer un nouveau lien
      </button>

      <ConfirmDialog
        open={confirm}
        title="Créer un nouveau lien ?"
        text="L'ancien lien arrêtera de marcher : il faudra te réabonner dans ton calendrier."
        confirmLabel="Créer"
        loading={busy}
        onConfirm={regenerate}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
