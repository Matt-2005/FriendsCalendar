-- La colonne endDate avait été ajoutée à la main en production (add_end_date_to_events.sql).
-- On l'ajoute ici de façon idempotente pour que l'historique des migrations soit complet.
ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);

-- Nouveau statut "Peut-être"
ALTER TYPE "public"."RSVPStatus" ADD VALUE IF NOT EXISTS 'MAYBE';

-- Suivi des rappels envoyés
ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Event_date_idx" ON "public"."Event"("date");

-- Supprimer un événement supprime aussi ses réponses
ALTER TABLE "public"."Rsvp" DROP CONSTRAINT IF EXISTS "Rsvp_eventID_fkey";
ALTER TABLE "public"."Rsvp" ADD CONSTRAINT "Rsvp_eventID_fkey" FOREIGN KEY ("eventID") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Abonnements aux notifications push
CREATE TABLE IF NOT EXISTS "public"."PushSubscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "public"."PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "public"."PushSubscription"("userId");
ALTER TABLE "public"."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_userId_fkey";
ALTER TABLE "public"."PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
