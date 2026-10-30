"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "../../components/Avatar";
import ConfirmDialog from "../../components/ConfirmDialog";
import Sheet from "../../components/Sheet";
import { useToast } from "../../components/Toast";

type Member = {
  id: number;
  pseudo: string;
  email: string;
  avatarUrl: string | null;
  role: "MEMBER" | "MANAGER";
  isSuperAdmin: boolean;
};
type Group = { id: number; name: string; code: string; canManage: boolean; myRole: "MEMBER" | "MANAGER" | null };

type Confirm =
  | { kind: "newCode" }
  | { kind: "leave" }
  | { kind: "remove"; m: Member }
  | { kind: "reset"; m: Member };

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => null);
  const j = await res?.json().catch(() => ({}));
  return { ok: Boolean(res?.ok), data: j ?? {}, error: (j?.error as string) ?? "Échec, réessaie" };
}

/** Le groupe affiché : invitation, demandes, membres et rôles */
export default function GroupAdmin({
  group,
  baseUrl,
  members,
  pending,
  memberCount,
  meId,
  superAdmin,
}: {
  group: Group;
  baseUrl: string;
  members: Member[];
  pending: Member[];
  memberCount: number;
  meId: number;
  superAdmin: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [password, setPassword] = useState<{ pseudo: string; password: string } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);

  const inviteUrl = `${baseUrl}/join/${group.code}`;
  const membersUrl = (m: Member) => `/api/groups/${group.id}/members/${m.id}`;

  async function share() {
    const text = `Rejoins « ${group.name} » sur Ziva pour voir les sorties et dire si tu viens 👉`;
    if (navigator.share) {
      try {
        await navigator.share({ title: group.name, text, url: inviteUrl });
      } catch {
        /* partage annulé */
      }
      return;
    }
    copy(`${text} ${inviteUrl}`);
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast("Copié 📋");
    } catch {
      toast("Copie impossible");
    }
  }

  async function run(key: string, url: string, method: string, body: unknown, done: string) {
    setBusy(key);
    const r = await call(url, method, body);
    setBusy(null);
    if (!r.ok) return toast(r.error), r;
    toast(done);
    router.refresh();
    return r;
  }

  async function onConfirm() {
    if (!confirm) return;
    if (confirm.kind === "newCode") {
      await run("confirm", `/api/groups/${group.id}`, "PATCH", { newCode: true }, "Nouveau code créé. L'ancien ne marche plus.");
    } else if (confirm.kind === "leave") {
      setBusy("confirm");
      const r = await call(`/api/groups/join?groupId=${group.id}`, "DELETE");
      if (!r.ok) return setBusy(null), toast(r.error);
      window.location.href = "/events";
      return;
    } else if (confirm.kind === "remove") {
      await run("confirm", membersUrl(confirm.m), "DELETE", undefined, `${confirm.m.pseudo} ne fait plus partie du groupe`);
    } else if (confirm.kind === "reset") {
      setBusy("confirm");
      const r = await call(`/api/admin/members/${confirm.m.id}/reset-password`, "POST");
      setBusy(null);
      if (!r.ok) toast(r.error);
      else setPassword({ pseudo: confirm.m.pseudo, password: r.data.password });
    }
    setConfirm(null);
  }

  async function simulate(m: Member) {
    setBusy(`sim-${m.id}`);
    const r = await call("/api/admin/simulate", "POST", { userId: m.id });
    if (!r.ok) return setBusy(null), toast("Impossible de lancer la simulation");
    // Rechargement complet pour repartir de zéro avec le profil simulé
    window.location.href = "/events";
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    const r = await run("rename", `/api/groups/${group.id}`, "PATCH", { name }, "Groupe renommé ✓");
    if (r.ok) setRenaming(false);
  }

  // Ce que je peux faire sur un membre
  const canRemove = (m: Member) => m.id !== meId && (superAdmin || (m.role === "MEMBER" && !m.isSuperAdmin));
  const hasActions = (m: Member) => m.id !== meId && (superAdmin || canRemove(m));

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
          <div className="small muted" style={{ fontWeight: 700 }}>
            Code pour rejoindre le groupe
          </div>
          {superAdmin && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRenaming(true)}>
              ✏️ Renommer
            </button>
          )}
        </div>
        <button type="button" className="group-code link-button" onClick={() => copy(group.code)} aria-label="Copier le code">
          {group.code}
        </button>
        <button type="button" className="btn btn-primary btn-block" onClick={share}>
          📤 Inviter quelqu'un
        </button>
        <p className="hint" style={{ marginTop: 8, textAlign: "center" }}>
          {group.canManage
            ? "Les nouveaux entrent leur code (ou ouvrent le lien), puis tu acceptes leur demande ici."
            : "Les nouveaux devront être acceptés par un admin du groupe."}
        </p>
        {group.canManage && (
          <button type="button" className="btn btn-ghost btn-sm btn-block" style={{ marginTop: 6 }} onClick={() => setConfirm({ kind: "newCode" })}>
            Changer le code
          </button>
        )}
      </div>

      {password && (
        <div className="alert alert-success" style={{ marginTop: 12, flexDirection: "column" }}>
          <span>
            Nouveau mot de passe de <strong>{password.pseudo}</strong> :
          </span>
          <code style={{ fontSize: 18, fontWeight: 800 }}>{password.password}</code>
          <span className="small">Envoie-le-lui, il pourra le changer depuis son profil.</span>
        </div>
      )}

      {group.canManage && pending.length > 0 && (
        <>
          <h3 className="subsection-title">🙋 Demandes en attente · {pending.length}</h3>
          <div className="card list-card">
            {pending.map((m) => (
              <div key={m.id} className="list-item">
                <Avatar user={m} size={36} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }}>{m.pseudo}</div>
                  <div className="small muted ellipsis">{m.email}</div>
                </div>
                <div className="row" style={{ gap: 6, flex: "none" }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy !== null}
                    onClick={() => run(`ok-${m.id}`, membersUrl(m), "PATCH", { action: "accept" }, `${m.pseudo} a rejoint le groupe 🎉`)}
                  >
                    {busy === `ok-${m.id}` ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Accepter"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy !== null}
                    aria-label={`Refuser ${m.pseudo}`}
                    onClick={() => run(`no-${m.id}`, membersUrl(m), "DELETE", undefined, "Demande refusée")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {group.canManage ? (
        <>
          <h3 className="subsection-title">Membres · {members.length}</h3>
          <div className="card list-card">
            {members.map((m) => (
              <div key={m.id} className="list-item">
                <Avatar user={m} size={36} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 650 }}>{m.id === meId ? `${m.pseudo} (toi)` : m.pseudo}</span>
                    {m.isSuperAdmin ? (
                      <span className="badge badge-pending">👑 Super admin</span>
                    ) : m.role === "MANAGER" ? (
                      <span className="badge badge-yes">⭐ Admin</span>
                    ) : null}
                  </div>
                  {superAdmin && <div className="small muted ellipsis">{m.email}</div>}
                </div>
                {hasActions(m) && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(m)} aria-label={`Options pour ${m.pseudo}`}>
                    •••
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="hint" style={{ marginTop: 10, paddingInline: 4 }}>
          {memberCount} membre{memberCount > 1 ? "s" : ""} dans le groupe.
        </p>
      )}

      {group.myRole && (
        <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 12, color: "var(--no)" }} onClick={() => setConfirm({ kind: "leave" })}>
          Quitter {group.name}
        </button>
      )}

      {/* Actions sur un membre */}
      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected?.pseudo}>
        {selected && (
          <div className="stack" style={{ gap: 8 }}>
            {superAdmin && !selected.isSuperAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-block"
                disabled={busy !== null}
                onClick={async () => {
                  const promote = selected.role === "MEMBER";
                  await run(
                    "role",
                    membersUrl(selected),
                    "PATCH",
                    { action: promote ? "promote" : "demote" },
                    promote ? `${selected.pseudo} est admin du groupe ⭐` : `${selected.pseudo} n'est plus admin`
                  );
                  setSelected(null);
                }}
              >
                {selected.role === "MEMBER" ? "⭐ Nommer admin du groupe" : "Retirer le rôle d'admin"}
              </button>
            )}
            {superAdmin && selected.role === "MEMBER" && !selected.isSuperAdmin && (
              <p className="hint" style={{ marginTop: -2, paddingInline: 4 }}>
                Un admin du groupe accepte les nouveaux, retire des membres et gère toutes les sorties du groupe.
              </p>
            )}
            {superAdmin && (
              <button type="button" className="btn btn-outline btn-block" disabled={busy !== null} onClick={() => simulate(selected)}>
                {busy === `sim-${selected.id}` ? <span className="spinner" /> : `👀 Utiliser l'appli comme ${selected.pseudo}`}
              </button>
            )}
            {superAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => {
                  setConfirm({ kind: "reset", m: selected });
                  setSelected(null);
                }}
              >
                🔑 Nouveau mot de passe
              </button>
            )}
            {canRemove(selected) && (
              <button
                type="button"
                className="btn btn-danger btn-block"
                onClick={() => {
                  setConfirm({ kind: "remove", m: selected });
                  setSelected(null);
                }}
              >
                Retirer du groupe
              </button>
            )}
          </div>
        )}
      </Sheet>

      {/* Renommer (super admin) */}
      <Sheet open={renaming} onClose={() => setRenaming(false)} title="Renommer le groupe">
        <form onSubmit={rename}>
          <div className="field">
            <label htmlFor="group-name" className="label">Nom du groupe</label>
            <input id="group-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy !== null || !name.trim()}>
            {busy === "rename" ? <span className="spinner" /> : "Enregistrer"}
          </button>
        </form>
      </Sheet>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "newCode"
            ? "Changer le code du groupe ?"
            : confirm?.kind === "leave"
              ? `Quitter ${group.name} ?`
              : confirm?.kind === "remove"
                ? `Retirer ${confirm.m.pseudo} du groupe ?`
                : `Réinitialiser le mot de passe de ${confirm?.kind === "reset" ? confirm.m.pseudo : ""} ?`
        }
        text={
          confirm?.kind === "newCode"
            ? "L'ancien code et l'ancien lien d'invitation ne marcheront plus. Les membres actuels restent dans le groupe."
            : confirm?.kind === "leave"
              ? "Tu ne verras plus ses sorties. Pour revenir, il faudra le code et l'accord d'un admin."
              : confirm?.kind === "remove"
                ? "Il ou elle ne verra plus les sorties du groupe. Ses réponses passées restent."
                : "Un mot de passe provisoire sera créé. L'ancien ne marchera plus."
        }
        confirmLabel={confirm?.kind === "newCode" ? "Changer" : confirm?.kind === "reset" ? "Réinitialiser" : confirm?.kind === "leave" ? "Quitter" : "Retirer"}
        danger={confirm?.kind === "leave" || confirm?.kind === "remove"}
        loading={busy === "confirm"}
        onConfirm={onConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
