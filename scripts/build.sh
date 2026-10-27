#!/usr/bin/env bash
# Compilation. Les migrations de la base ne tournent QUE pour le déploiement de production Vercel :
# jamais pour les aperçus (Dependabot, branches) ni sur ton Mac.
set -euo pipefail
if [ "${VERCEL_ENV:-}" = "production" ]; then
  echo "▶ Migrations de la base de production"
  npx prisma migrate deploy
else
  echo "▶ Migrations ignorées (environnement : ${VERCEL_ENV:-local})"
fi
npx next build --turbopack
