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

```bash
npm install
npm run dev
```

`npm run build` applique d'abord les migrations Prisma sur la base indiquée par `DATABASE_URL`, puis compile l'appli.

## Notifications sur iPhone

Apple n'autorise les notifications web qu'aux applis ajoutées à l'écran d'accueil (iOS 16.4 ou plus récent) : Safari → Partager → « Sur l'écran d'accueil ». L'appli affiche ces étapes toute seule aux utilisateurs d'iPhone.
