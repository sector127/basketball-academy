# syntax=docker/dockerfile:1
# Debian (glibc) rather than Alpine so bcrypt's prebuilt binary works.

FROM node:22-bookworm-slim AS base
# Same pnpm version as "packageManager" in package.json
RUN npm install -g pnpm@12.4.1
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Development: source is mounted by docker-compose, hot reload via `pnpm dev`
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "dev"]

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build && pnpm prune --prod --ignore-scripts

# Production: `docker build --target prod -t basketball-academy .`
# No pnpm at runtime: Next.js is started directly with node (pnpm would try to
# write to /app on startup, and signals reach the app without a wrapper process)
FROM node:22-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    UPLOAD_DIR=/app/uploads
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/messages ./messages
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node
# Mount a volume here so uploaded photos survive redeploys
VOLUME ["/app/uploads"]
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
