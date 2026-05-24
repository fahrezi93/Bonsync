# ============================================================
# Stage 1: deps — install dependencies + generate Prisma client
# ============================================================
FROM node:22-alpine AS deps

# Required for Prisma binary (musl) and Next.js native modules
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy manifests for layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install ALL dependencies (dev included — needed for prisma generate)
RUN npm ci

# Generate Prisma client targeting linux-musl (Alpine)
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl-openssl-3.0.x"
RUN npx prisma generate

# ============================================================
# Stage 2: builder — compile Next.js with output: standalone
# ============================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy node_modules (with generated Prisma client) from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# NEXT_PUBLIC_* vars MUST be present at build time.
# Pass them as build args — actual values injected at Cloud Run deploy time.
# We use placeholder stubs here so `next build` won't throw.
ARG NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=placeholder-anon-key
ARG NEXT_PUBLIC_SITE_URL=https://placeholder.example.com

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy DATABASE_URL placeholder for build-time Prisma verification (injected at runtime in Cloud Run)
ENV DATABASE_URL="postgresql://postgres:placeholder@localhost:5432/placeholder?sslmode=require"

# Build Next.js — requires output: 'standalone' in next.config.ts
RUN npx next build

# ============================================================
# Stage 3: runner — minimal production image (~200MB)
# ============================================================
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone output (contains its own node_modules subset)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (not included in standalone by default)
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public folder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Cloud Run injects PORT env var; default 8080
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

USER nextjs

EXPOSE 8080

# Use standalone server.js — `next start` is NOT compatible with standalone output
CMD ["node", "server.js"]
