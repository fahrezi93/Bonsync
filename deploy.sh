#!/usr/bin/env bash
# =============================================================
# BonSync — Google Cloud Run Deployment Script
# =============================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites:
#   1. gcloud CLI installed & authenticated  → gcloud auth login
#   2. Docker installed and running
#   3. .env.production.deploy sudah diisi dengan nilai yang benar
# =============================================================

set -euo pipefail

# ─── Auto-load dari .env.production.deploy ────────────────────────────────────
ENV_FILE="$(dirname "$0")/.env.production.deploy"
if [[ -f "$ENV_FILE" ]]; then
  echo -e "\033[0;34m[INFO]\033[0m Loading env from .env.production.deploy"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo -e "\033[0;31m[ERROR]\033[0m .env.production.deploy not found. Copy .env.production.deploy.example and fill in the values."
  exit 1
fi

# ─── CONFIG ───────────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-asia-southeast2}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-bonsync-app}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

log()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Validation ───────────────────────────────────────────────────────────────
[[ "$PROJECT_ID" == "your-gcp-project-id" ]] && error "Set GCP_PROJECT_ID env var or edit PROJECT_ID in deploy.sh"
[[ -z "$DATABASE_URL" ]]                     && error "DATABASE_URL env var is required"
[[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]         && error "NEXT_PUBLIC_SUPABASE_URL env var is required"
[[ -z "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]] && error "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY env var is required"
[[ -z "$GEMINI_API_KEY" ]]                   && error "GEMINI_API_KEY env var is required"

# ─── Step 1: gcloud project setup ─────────────────────────────────────────────
log "Setting active GCP project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

log "Enabling required Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --quiet

# ─── Step 2: Docker build & push ──────────────────────────────────────────────
log "Configuring Docker to use gcloud credentials..."
gcloud auth configure-docker --quiet

log "Building Docker image: ${IMAGE_NAME}"
docker build \
  --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  --build-arg DATABASE_URL="${DATABASE_URL}" \
  -t "${IMAGE_NAME}:latest" \
  .

log "Pushing image to Google Container Registry..."
docker push "${IMAGE_NAME}:latest"
success "Image pushed: ${IMAGE_NAME}:latest"

# ─── Step 3: Run DB migrations ────────────────────────────────────────────────
log "Running Prisma migrations on production database..."
DATABASE_URL="${DATABASE_URL}" npx prisma migrate deploy --schema=prisma/schema.prisma
success "Database migrations applied"

# ─── Step 4: Deploy to Cloud Run ──────────────────────────────────────────────
log "Deploying to Cloud Run (region: ${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_NAME}:latest" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=60 \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="NEXT_TELEMETRY_DISABLED=1" \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
  --set-env-vars="NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}" \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --quiet

# ─── Done ─────────────────────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --format="value(status.url)")

echo ""
echo "═══════════════════════════════════════════════════"
success "BonSync deployed successfully! 🚀"
echo "═══════════════════════════════════════════════════"
echo -e "  Live URL: ${GREEN}${SERVICE_URL}${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
warn "IMPORTANT: Update NEXT_PUBLIC_SITE_URL in your Supabase Auth redirect URLs:"
echo "  ${SERVICE_URL}/auth/callback"
echo ""
