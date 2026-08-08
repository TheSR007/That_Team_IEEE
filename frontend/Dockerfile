# Stage 1: Base image
FROM node:22-alpine AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
RUN corepack enable && corepack prepare pnpm@11 --activate
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 3: Development target (Runs react-router dev with hot reloading)
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN corepack enable && corepack prepare pnpm@11 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Stage 4: Production Builder
FROM base AS builder
RUN corepack enable && corepack prepare pnpm@11 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Stage 5: Production Runner target (Runs react-router-serve)
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 10001 nodejs && \
    adduser --system --uid 10001 reactrouter

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/build ./build

USER reactrouter

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

STOPSIGNAL SIGTERM

CMD ["npx", "react-router-serve", "./build/server/index.js"]
