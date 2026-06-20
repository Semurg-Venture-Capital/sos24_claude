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
# prefer-offline: всё из стора, недостающие linux-x64 нативные бинари (lightningcss/swc/sharp)
# дотягиваются с npm (их немного → проходит и на флаки-сети). Стор macOS не содержит linux-бинарей.
RUN --mount=type=bind,from=pnpmstore,target=/pnpm-store,rw \
    pnpm install --frozen-lockfile --filter admin... --prefer-offline \
      --store-dir /pnpm-store --package-import-method=copy \
      --config.fetch-timeout=600000 --config.fetch-retries=10
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
