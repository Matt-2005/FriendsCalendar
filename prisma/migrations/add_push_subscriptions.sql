-- Migration pour ajouter le support des notifications push
-- À exécuter manuellement sur la base de données de production

-- Créer la table PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Créer un index unique pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
