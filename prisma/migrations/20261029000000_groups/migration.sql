-- Plusieurs groupes d'amis / organisations dans la même appli.
-- Tous les comptes existants sont mis dans le groupe « Les Indécis », avec leurs sorties.
-- Écrite pour pouvoir être rejouée sans casse (IF NOT EXISTS, ON CONFLICT).

DO $$ BEGIN
  CREATE TYPE "public"."GroupRole" AS ENUM ('MEMBER', 'MANAGER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "public"."Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Group_code_key" ON "public"."Group"("code");

CREATE TABLE IF NOT EXISTS "public"."Membership" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "role" "public"."GroupRole" NOT NULL DEFAULT 'MEMBER',
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("userId", "groupId")
);
CREATE INDEX IF NOT EXISTS "Membership_groupId_status_idx" ON "public"."Membership"("groupId", "status");
ALTER TABLE "public"."Membership" DROP CONSTRAINT IF EXISTS "Membership_userId_fkey";
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Membership" DROP CONSTRAINT IF EXISTS "Membership_groupId_fkey";
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Le groupe historique (code modifiable ensuite depuis le profil)
INSERT INTO "public"."Group" ("name", "code")
SELECT 'Les Indécis', 'INDECIS'
WHERE NOT EXISTS (SELECT 1 FROM "public"."Group");

-- Tout le monde en fait partie
INSERT INTO "public"."Membership" ("userId", "groupId", "role", "status")
SELECT u."id", g."id", 'MEMBER', 'ACTIVE'
FROM "public"."User" u
CROSS JOIN (SELECT "id" FROM "public"."Group" ORDER BY "id" LIMIT 1) g
ON CONFLICT DO NOTHING;

-- Groupe affiché
ALTER TABLE "public"."User" ADD COLUMN IF NOT EXISTS "activeGroupId" INTEGER;
ALTER TABLE "public"."User" DROP CONSTRAINT IF EXISTS "User_activeGroupId_fkey";
ALTER TABLE "public"."User" ADD CONSTRAINT "User_activeGroupId_fkey" FOREIGN KEY ("activeGroupId") REFERENCES "public"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Chaque sortie appartient à un groupe : les sorties existantes vont dans « Les Indécis »
ALTER TABLE "public"."Event" ADD COLUMN IF NOT EXISTS "groupId" INTEGER;
UPDATE "public"."Event" SET "groupId" = (SELECT "id" FROM "public"."Group" ORDER BY "id" LIMIT 1) WHERE "groupId" IS NULL;
ALTER TABLE "public"."Event" ALTER COLUMN "groupId" SET NOT NULL;
ALTER TABLE "public"."Event" DROP CONSTRAINT IF EXISTS "Event_groupId_fkey";
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Event_groupId_date_idx" ON "public"."Event"("groupId", "date");
