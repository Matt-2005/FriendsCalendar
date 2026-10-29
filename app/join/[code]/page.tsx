import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGroup, getMe, isMemberOf } from "@/lib/session";
import { findGroupByCode, normalizeCode } from "@/lib/groups";
import JoinScreen from "../JoinScreen";
import styles from "../../auth.module.css";

export const metadata: Metadata = { title: "Invitation" };

// Lien d'invitation à partager : https://…/join/ABC123
export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code);
  const [group, me] = await Promise.all([findGroupByCode(code), getMe()]);

  if (me) {
    const [pending, current] = await Promise.all([
      prisma.membership.findMany({
        where: { userId: me.id, status: "PENDING" },
        select: { groupId: true, group: { select: { name: true } } },
      }),
      getGroup(),
    ]);
    return (
      <JoinScreen
        pseudo={me.pseudo}
        hasGroup={Boolean(current)}
        initialCode={code}
        inviteGroupName={group?.name}
        alreadyMember={Boolean(group && isMemberOf(me, group.id))}
        pending={pending.map((p) => ({ groupId: p.groupId, name: p.group.name }))}
      />
    );
  }

  const back = `/join/${code}`;
  return (
    <main className={styles.screen}>
      <div className={styles.box}>
        <div className={styles.logo}>
          <img src="/logoCalendrier.png" alt="" />
        </div>
        {group ? (
          <>
            <h1 className={styles.title}>Tu es invité·e dans {group.name} 🎉</h1>
            <p className={styles.subtitle}>Les sorties et les dispos du groupe, au même endroit. Crée ton compte pour rejoindre.</p>
            <div className="stack" style={{ gap: 10 }}>
              <Link href={`/register?code=${code}`} className="btn btn-primary btn-lg btn-block">
                Créer mon compte
              </Link>
              <Link href={`/login?callbackUrl=${encodeURIComponent(back)}`} className="btn btn-outline btn-lg btn-block">
                J'ai déjà un compte
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Lien d'invitation invalide</h1>
            <p className={styles.subtitle}>Ce code n'existe pas ou a été changé. Demande un nouveau lien à l'organisateur du groupe.</p>
            <Link href="/" className="btn btn-outline btn-lg btn-block">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
