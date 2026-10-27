#!/usr/bin/env bash
# Base de données de TEST sur ton Mac (jamais la production).
#   npm run dev:db      → démarre la base de test (la crée et la remplit au premier lancement)
#   npm run dev:reset   → remet les données de démo à zéro
#   npm run dev:stop    → arrête la base de test
set -euo pipefail

DATA="$HOME/.lesindecis-devdb"   # hors iCloud : une base de données ne doit pas être synchronisée
PORT=54330
URL="postgresql://postgres@localhost:${PORT}/lesindecis"
cd "$(dirname "$0")/.."

if ! command -v pg_ctl >/dev/null; then
  echo "❌ PostgreSQL n'est pas installé. Installe-le avec : brew install postgresql@18"
  exit 1
fi

if [ "${1:-}" = "stop" ]; then
  pg_ctl -D "${DATA}" stop -m fast >/dev/null 2>&1 && echo "🛑 Base de test arrêtée" || echo "La base de test n'était pas démarrée"
  exit 0
fi

FRESH=0
if [ ! -d "${DATA}" ]; then
  echo "📦 Création de la base de test dans ${DATA}…"
  initdb -D "${DATA}" -U postgres --auth=trust >/dev/null
  FRESH=1
fi

if ! pg_ctl -D "${DATA}" status >/dev/null 2>&1; then
  pg_ctl -D "${DATA}" -o "-p ${PORT} -k ''" -l "${DATA}/server.log" start >/dev/null
fi
for _ in $(seq 1 20); do pg_isready -h localhost -p ${PORT} >/dev/null 2>&1 && break; sleep 0.5; done
psql -h localhost -p ${PORT} -U postgres -tAc "select 1 from pg_database where datname='lesindecis'" | grep -q 1 \
  || createdb -h localhost -p ${PORT} -U postgres lesindecis

echo "🔧 Mise à jour de la structure…"
DATABASE_URL="${URL}" npx prisma migrate deploy >/dev/null

if [ "$FRESH" = 1 ] || [ "${1:-}" = "reset" ]; then
  echo "🌱 Ajout des potes et sorties de démo…"
  DATABASE_URL="${URL}" npx tsx prisma/seed.ts
fi

# Next.js lit ce fichier en priorité sur .env avec "npm run dev"
if [ ! -f .env.development.local ]; then
  cat > .env.development.local <<ENV
# Utilisé seulement par "npm run dev" : base de TEST locale, pas la production.
DATABASE_URL=${URL}
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-local-secret-pas-utilise-en-prod
# Pour tester la connexion Google en local, décommente et colle tes clés :
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
ENV
  echo "📝 .env.development.local créé"
fi

echo ""
echo "✅ Base de test prête. Lance maintenant :  npm run dev"
echo "   puis ouvre http://localhost:3000/login et choisis un pote de test."
