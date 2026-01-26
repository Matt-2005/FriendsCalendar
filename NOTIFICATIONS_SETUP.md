# Configuration des Notifications Push

Ce guide explique comment configurer les notifications push web pour votre application.

## 📋 Prérequis

- Base de données PostgreSQL
- Vercel (ou autre plateforme de déploiement)
- HTTPS activé (obligatoire pour les notifications push)

## 🔑 Étape 1 : Générer les clés VAPID

Les clés VAPID sont nécessaires pour identifier votre serveur auprès des navigateurs.

```bash
npx web-push generate-vapid-keys
```

Vous obtiendrez quelque chose comme :
```
Public Key: BCDYUR6FW43-WH6v__baAUD6SDtpNavAOUFlTCoYxLl_UNWajZYh6ppwfn9My8xq-vNdWM0xMLOb59Msp_EOdEQ
Private Key: KM1QNUkIaR8OjKPHAAOhXromreYxMFKwo-bi_2pgrMA
```

⚠️ **Important** : Gardez la clé privée secrète !

## 🗄️ Étape 2 : Migration de la base de données

Exécutez la migration pour créer la table `PushSubscription` :

```bash
npx prisma migrate deploy
```

Ou en développement :
```bash
npx prisma migrate dev
```

## ⚙️ Étape 3 : Variables d'environnement

### Sur Vercel (ou votre plateforme)

Ajoutez ces variables d'environnement :

1. **NEXT_PUBLIC_VAPID_PUBLIC_KEY** (Public)
   - Valeur : Votre clé publique VAPID
   - Cocher "Expose to browser"

2. **VAPID_PRIVATE_KEY** (Secret)
   - Valeur : Votre clé privée VAPID
   - NE PAS exposer au browser

3. **VAPID_SUBJECT** (Secret ou Public)
   - Valeur : `mailto:votre-email@example.com`
   - Remplacez par votre vrai email

### Fichier .env local (développement)

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BCDYUR6FW43-WH6v__baAUD6SDtpNavAOUFlTCoYxLl_UNWajZYh6ppwfn9My8xq-vNdWM0xMLOb59Msp_EOdEQ"
VAPID_PRIVATE_KEY="KM1QNUkIaR8OjKPHAAOhXromreYxMFKwo-bi_2pgrMA"
VAPID_SUBJECT="mailto:contact@lesindecis.fr"
```

## 🚀 Étape 4 : Déploiement

1. Commitez et pushez votre code
2. Vercel va redéployer automatiquement
3. Vérifiez que les variables d'environnement sont bien configurées

## 🧪 Étape 5 : Test

1. Connectez-vous à votre compte sur l'application déployée
2. Allez dans "Mon Compte"
3. Descendez jusqu'à la section "Notifications"
4. Cliquez sur "🔔 Activer les notifications"
5. Autorisez les notifications dans votre navigateur
6. Créez un nouvel événement depuis un autre compte
7. Vous devriez recevoir une notification !

## 📱 Fonctionnement

### Notifications envoyées

Les utilisateurs reçoivent une notification pour :

- ✅ **Nouvel événement créé** : Tous les utilisateurs (sauf le créateur)
- ✅ **Événement supprimé** : Tous les participants
- ⏳ **Événement modifié** : À implémenter (pas d'API de modification pour le moment)

### Support des navigateurs

- ✅ Chrome / Edge (Desktop & Mobile Android)
- ✅ Firefox (Desktop & Mobile Android)
- ✅ Safari (iOS 16.4+, macOS 13+)
- ❌ Safari (anciennes versions)

## 🔧 Dépannage

### "VAPID public key not configured"

→ La variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY` n'est pas définie ou ne commence pas par `NEXT_PUBLIC_`

### "Failed to subscribe"

→ Vérifiez que :
- Le site est en HTTPS
- Les clés VAPID sont correctes
- Le service worker est bien enregistré (`/sw.js` accessible)

### Les notifications ne sont pas reçues

→ Vérifiez que :
- L'utilisateur a activé les notifications
- Les notifications ne sont pas bloquées dans le navigateur
- La base de données contient bien les subscriptions (`PushSubscription` table)

### Erreur 410 Gone

→ La subscription est expirée ou révoquée. Elle sera automatiquement supprimée de la base de données.

## 📖 Documentation

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push library](https://github.com/web-push-libs/web-push)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)

## 💡 Améliorations futures

- [ ] Ajouter une API de modification d'événement avec notifications
- [ ] Permettre de choisir quels types de notifications recevoir
- [ ] Ajouter des notifications pour les RSVP (quand quelqu'un accepte/refuse)
- [ ] Grouper les notifications multiples
- [ ] Ajouter des actions dans les notifications (Accepter/Refuser directement)
