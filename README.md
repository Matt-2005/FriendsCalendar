# Les Indécis Agenda

Une appli web pensée pour le téléphone qui aide un groupe de potes à s'organiser : proposer une sortie, répondre en un geste (j'y vais / peut-être / pas dispo), dire quand on est libre, et retrouver tout ça dans l'agenda de son téléphone.

## Fonctionnalités

- **Sorties** : création rapide (raccourcis « Ce soir », « Demain », « Samedi », heures et durées en un geste), modification, suppression, partage (WhatsApp, SMS…).
- **Réponses** : J'y vais / Peut-être / Pas dispo, liste de qui vient et de qui n'a pas encore répondu, bouton « Relancer » pour l'organisateur.
- **Dispos** : on choisit un « pinceau » (Dispo, Pas dispo, Vacances) puis on touche les jours ; raccourci « tous les vendredis et samedis » ; périodes de vacances ; suggestion des **meilleurs jours pour se voir**.
- **Calendrier** : vue du mois avec les sorties et le nombre de potes dispo par jour.
- **Agenda du téléphone** : abonnement personnel (Apple Calendar, Google Agenda, Outlook), plus un bouton « Ajouter à mon agenda » par sortie, avec rappels.
- **Notifications push** : nouvelle sortie, sortie modifiée ou annulée, réponse d'un pote à ta sortie, rappel le jour J et relance la veille.
- **Appli installable** sur l'écran d'accueil (PWA).
- **Admin** : un compte `ADMIN` peut créer un mot de passe provisoire pour un membre qui a oublié le sien (depuis son Profil).

## Technologies

| Rôle | Outil |
| --- | --- |
| Application (pages + API) | Next.js 15 (App Router), React 19, TypeScript strict |
| Base de données | PostgreSQL (Prisma Postgres) via l'ORM Prisma 6 |
| Connexion | next-auth 4 : email + mot de passe (bcrypt) et Google |
| Photos | Cloudinary |
| Notifications | Web Push (VAPID) + service worker |
| Agenda | flux iCalendar (ical-generator) |
| Hébergement | Vercel (région Francfort), tâche planifiée quotidienne |
| Qualité | ESLint, TypeScript, GitHub Actions, Dependabot |

## Organisation du code

```
app/                    Pages et routes API (Next.js App Router)
  (app)/                Pages réservées aux membres connectés (Sorties, Calendrier, Dispos, Profil)
  api/                  Routes API (chacune vérifie la session et valide ce qu'elle reçoit)
  components/           Composants partagés (boutons de réponse, navigation, notifications…)
  login/, register/     Connexion et inscription
src/lib/                Logique serveur : session, base, notifications, dates, sécurité…
src/types/              Types TypeScript complémentaires
prisma/                 Schéma, migrations et données de démo (seed)
scripts/dev-db.sh       Base de test locale
public/                 Icônes, service worker
```

Les modules de `src/lib` qui touchent à la base ou aux secrets commencent par `import "server-only"` : ils ne peuvent pas être envoyés au navigateur par erreur.

## Sécurité

- **Sessions** chiffrées (next-auth, `NEXTAUTH_SECRET`), mots de passe hachés avec bcrypt, 8 caractères minimum.
- **Droits vérifiés côté serveur** à chaque requête : seul l'organisateur (ou un admin) modifie une sortie, chacun ne touche qu'à ses dispos, les actions admin relisent le rôle en base.
- **Limitation des tentatives** : connexion (8 essais / 15 min), inscription, relances, envois de notifications, photos.
- **Anti-CSRF** : les requêtes qui modifient des données doivent venir du site lui-même (`middleware.ts`).
- **En-têtes de sécurité** (`next.config.ts`) : politique de contenu (CSP), HSTS, interdiction d'intégrer le site dans une iframe, etc.
- **Notifications** : seuls les services officiels (Apple, Google, Mozilla, Microsoft) sont acceptés.
- **Secrets** uniquement dans les variables d'environnement, jamais dans git (`.env.example` sert de modèle).
- Lien d'agenda personnel aléatoire et régénérable ; clé de la tâche planifiée comparée en temps constant.

Vérifier avant d'envoyer du code : `npm run check` (lint + TypeScript). GitHub refait ces vérifications et la compilation à chaque envoi.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Base PostgreSQL (Prisma) |
| `NEXTAUTH_SECRET` | Clé de chiffrement des sessions |
| `NEXTAUTH_URL` | Adresse publique du site, ex. `https://calendar.matthewle.fr` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photos de profil |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Notifications push. Générer avec `npx web-push generate-vapid-keys` |
| `CRON_SECRET` | Protège la tâche quotidienne `/api/cron/reminders` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Bouton « Continuer avec Google » (masqué si absentes). Adresse de retour à déclarer chez Google : `https://calendar.matthewle.fr/api/auth/callback/google` |

Sans les clés VAPID, l'appli fonctionne normalement, simplement sans notifications.

## Rappels quotidiens

`vercel.json` déclare une tâche planifiée tous les jours à 8 h UTC sur `/api/cron/reminders`. Vercel envoie automatiquement l'en-tête `Authorization: Bearer $CRON_SECRET`. Sur un autre hébergeur, il suffit d'appeler cette adresse une fois par jour avec cet en-tête.

## Développement

### Tester en local, sans toucher à la production

```bash
npm install
npm run dev:db     # crée/démarre une base de TEST sur ton Mac, avec 5 potes et des sorties de démo
npm run dev        # puis ouvre http://localhost:3000/login
```

- Sur la page de connexion, un encadré **« 🧪 Mode test »** permet de se connecter en un clic avec n'importe quel pote de démo (mot de passe de tous : `demo1234`). Il n'existe qu'en local, jamais en ligne.
- Un badge en bas à droite indique la base utilisée : vert **TEST · base locale**, ou rouge **DEV sur la base de PRODUCTION** si `.env.development.local` est absent.
- `npm run dev:reset` remet les données de démo à zéro, `npm run dev:stop` arrête la base de test. Elle est stockée dans `~/.lesindecis-devdb` (hors iCloud).
- Connexion Google en local : ajoute `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans `.env.development.local`, et déclare `http://localhost:3000/api/auth/callback/google` chez Google.
- Prévisualiser un thème de saison : `SEASON_OVERRIDE=noel npm run dev` (`halloween`, `noel`, `nouvel-an`, `ete` ou `none`).

`npm run build` compile l'appli. Les migrations Prisma ne s'appliquent que lors du déploiement de **production** sur Vercel (`VERCEL_ENV=production`) : jamais pour les aperçus, la CI ou ton Mac (voir `scripts/build.sh`).

## Thèmes de saison

Couleurs et décor changent tout seuls selon la date (heure de Paris) — voir `src/lib/season.ts` :

| Période | Thème |
| --- | --- |
| 15 oct → 2 nov | 🎃 Halloween : orange citrouille, chauves-souris, araignée, fantômes |
| 1er → 26 déc | 🎄 Noël : rouge, neige qui tombe |
| 27 déc → 3 janv | 🥂 Nouvel An : doré, confettis |
| juillet → août | ☀️ Été : turquoise, soleil |

Le reste de l'année, le thème violet habituel. Chacun peut couper les décorations dans son Profil (« Ambiance »). Les animations s'arrêtent si le téléphone est réglé pour limiter les mouvements.

## Notifications sur iPhone

Apple n'autorise les notifications web qu'aux applis ajoutées à l'écran d'accueil (iOS 16.4 ou plus récent) : Safari → Partager → « Sur l'écran d'accueil ». L'appli affiche ces étapes toute seule aux utilisateurs d'iPhone.
