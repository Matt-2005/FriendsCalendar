-- Migration pour ajouter le système de disponibilités
-- À exécuter manuellement sur la base de données de production

-- Créer l'enum pour les types de disponibilité
CREATE TYPE "AvailabilityType" AS ENUM ('AVAILABLE', 'VACATION', 'BUSY');

-- Créer la table Availability
CREATE TABLE "Availability" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "AvailabilityType" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Créer les index
CREATE INDEX "Availability_userId_idx" ON "Availability"("userId");
CREATE INDEX "Availability_startDate_endDate_idx" ON "Availability"("startDate", "endDate");
