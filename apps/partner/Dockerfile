# syntax=docker/dockerfile:1
# SOS24 Partner (Next.js 16, standalone) — сборка из pnpm-монорепо.
# Контекст сборки = КОРЕНЬ репо:  docker build -f apps/partner/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.sos24.uz -t <img> .

# ---------- build ----------
FROM node:22-slim AS build
RUN corepack enable
# Воркспейс содержит puppeteer (apps/api) — его postinstall качает Chromium и падает в этом
# образе (нет unzip). Кабинету Chromium не нужен → пропускаем загрузку.
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /repo
COPY . .
# Офлайн-install из локального pnpm-store (npm-реестр под эмуляцией флаки).
# Сборка: docker build --build-context pnpmstore="$(dirname "$(pnpm store path)")" ...
RUN --mount=type=bind,from=pnpmstore,target=/pnpm-store,rw \
    pnpm install --frozen-lockfile --filter partner... --offline \
      --store-dir /pnpm-store --package-import-method=copy
# NEXT_PUBLIC_* инлайнятся в бандл на этапе сборки → API-URL должен быть тут
ARG NEXT_PUBLIC_API_URL=https://api.sos24.uz
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter partner run build

# ---------- runtime ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3036 HOSTNAME=0.0.0.0
# standalone-вывод Next.js сохраняет структуру монорепо
COPY --from=build /repo/apps/partner/.next/standalone ./
COPY --from=build /repo/apps/partner/.next/static ./apps/partner/.next/static
COPY --from=build /repo/apps/partner/public ./apps/partner/public
EXPOSE 3036
CMD ["node", "apps/partner/server.js"]
