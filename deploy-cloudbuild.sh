#!/usr/bin/env bash
# =============================================================
# BonSync — Cloud Run Deployment via Cloud Build (No Docker needed locally)
# =============================================================
# CARA PALING MUDAH — tidak perlu Docker di lokal!
# Gunakan ini kalau kamu pakai Windows dan Docker lambat/bermasalah.
#
# Usage (di Git Bash / WSL):
#   bash deploy-cloudbuild.sh
#
# Prerequisites:
#   - gcloud CLI sudah diinstall & authenticated
#   - .env.production sudah diisi (lihat format di bawah)
# =============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Load .env.production if exists ───────────────────────────────────────────
if [[ -f ".env.production.deploy" ]]; then
  log "Loading .env.production.deploy..."
  export $(grep -v '^#' .env.production.deploy | xargs)
fi

# ─── Validation ───────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-asia-southeast2}"

[[ -z "$PROJECT_ID" ]]                           && error "GCP_PROJECT_ID not set"
[[ -z "${DATABASE_URL:-}" ]]                     && error "DATABASE_URL not set"
[[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]         && error "NEXT_PUBLIC_SUPABASE_URL not set"
[[ -z "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}" ]] && error "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not set"
[[ -z "${NEXT_PUBLIC_SITE_URL:-}" ]]             && error "NEXT_PUBLIC_SITE_URL not set"
[[ -z "${GEMINI_API_KEY:-}" ]]                   && error "GEMINI_API_KEY not set"

# ─── Setup ────────────────────────────────────────────────────────────────────
log "Setting GCP project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

log "Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --quiet

# ─── Run DB migrations ────────────────────────────────────────────────────────
log "Running Prisma migrations on production DB..."
DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy
success "Migrations done"

# ─── Submit to Cloud Build ────────────────────────────────────────────────────
log "Submitting build to Cloud Build..."
log "(This will take 3-5 minutes. Coffee time! ☕)"

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=\
_DATABASE_URL="${DATABASE_URL}",\
_GEMINI_API_KEY="${GEMINI_API_KEY}",\
_NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}",\
_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}",\
_NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}",\
_REGION="${REGION}" \
  .

# ─── Get URL ──────────────────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe bonsync-app \
  --region="${REGION}" \
  --format="value(status.url)" 2>/dev/null || echo "")

echo ""
echo "═══════════════════════════════════════════════════"
success "BonSync deployed via Cloud Build! 🚀"
echo "═══════════════════════════════════════════════════"
[[ -n "$SERVICE_URL" ]] && echo -e "  Live URL: ${GREEN}${SERVICE_URL}${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
warn "Don't forget to:"
echo "  1. Update NEXT_PUBLIC_SITE_URL di Cloud Run jika URL-nya berubah"
echo "  2. Tambahkan ${SERVICE_URL}/auth/callback ke Supabase Auth redirect URLs"
echo ""
