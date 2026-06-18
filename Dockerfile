# ── Stage 1: Build frontend ──────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ── Stage 2: Backend dependencies ────────────────────
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .
RUN npx prisma generate

# ── Stage 3: Production image ─────────────────────────
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY --from=server-deps /app/server ./server
COPY --from=client-builder /app/client/dist ./server/public

WORKDIR /app/server
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/index.js"]
