# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# api-kytalist — multi-stage production Dockerfile
#
# Stages
#   1. deps     – install ALL dependencies (including devDeps needed for build)
#   2. builder  – compile TypeScript + generate Prisma client
#   3. runner   – lean production image (only runtime deps + compiled output)
# ─────────────────────────────────────────────────────────────────────────────

ARG NODE_VERSION=22

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps

WORKDIR /app

# Only copy manifests first so this layer is cached until they change
COPY package.json package-lock.json ./

# ci = clean, reproducible, respects lock file
RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Bring in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source (schema must arrive before prisma generate)
COPY prisma ./prisma
COPY src ./src
COPY prisma.config.ts tsconfig.json package.json ./

# prisma generate writes to ./generated/prisma
# tsc compiles src/ → dist/
# DATABASE_URL is not needed at build time — only the schema is read for codegen
RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs appuser

# Install only production dependencies in the final image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (output path matches schema: ../generated/prisma)
COPY --from=builder /app/generated ./generated

# Copy Prisma schema + migrations (needed for `prisma migrate deploy` at startup)
COPY --from=builder /app/prisma ./prisma

# Copy public assets
COPY public ./public

# Drop to non-root
USER appuser

EXPOSE 3001

# Healthcheck — Coolify can also configure this via UI, but having it here
# means it works in plain Docker too.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health/live').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/server.js"]
