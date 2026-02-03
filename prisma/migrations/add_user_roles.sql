-- Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- Add role column to User table with default USER
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Update all existing users to have USER role
UPDATE "User" SET "role" = 'USER' WHERE "role" IS NULL;
