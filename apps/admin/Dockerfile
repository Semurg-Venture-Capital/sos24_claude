# syntax=docker/dockerfile:1
# SOS24 Admin (Next.js 15, standalone) — сборка из pnpm-монорепо.
# Контекст сборки = КОРЕНЬ репо:  docker build -f apps/admin/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.sos24.uz -t <img> .

# ---------- build ----------
FROM node:22-slim AS build
RUN corepack enable
# Воркспейс содержит puppeteer (apps/api) — его postinstall качает Chromium и падает в этом
# образе (нет unzip). Админке Chromium не нужен → пропускаем загрузку.
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /repo
COPY . .
# Офлайн-install из локального pnpm-store (npm-реестр под эмуляцией флаки).
# Сборка: docker build --build-context pnpmstore="$(dirname "$(pnpm store path)")" ...
# Полный offline: стор содержит и linux-x64 нативные бинари (предварительно добавлены
# `pnpm store add @next/swc-linux-x64-gnu lightningcss-linux-x64-gnu @img/sharp-* @tailwindcss/oxide-linux-x64-gnu`).
# Docker-egress к npm бывает подвисает (VPN) → не зависим от сети при сборке.
RUN --mount=type=bind,from=pnpmstore,target=/pnpm-store,rw \
    pnpm install --frozen-lockfile --filter admin... --offline \
      --store-dir /pnpm-store --package-import-method=copy
# NEXT_PUBLIC_* инлайнятся в бандл на этапе сборки → API-URL должен быть тут
ARG NEXT_PUBLIC_API_URL=https://api.sos24.uz
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter admin run build

# ---------- runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3035 HOSTNAME=0.0.0.0
# standalone-вывод Next.js сохраняет структуру монорепо
COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=build /repo/apps/admin/public ./apps/admin/public
EXPOSE 3035
CMD ["node", "apps/admin/server.js"]
