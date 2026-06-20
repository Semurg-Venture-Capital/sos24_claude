# syntax=docker/dockerfile:1
# SOS24 API (NestJS) — сборка из pnpm-монорепо.
# Контекст сборки = КОРЕНЬ репо:  docker build -f apps/api/Dockerfile -t <img> .

# ---------- build ----------
FROM node:22-slim AS build
RUN corepack enable && apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# Не качаем бандл Chromium при install — в runtime ставим системный (см. ниже).
# Сетевые ретраи/таймауты — npm-реестр под эмуляцией бывает флаки.
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /repo
COPY . .
# Ставим ТОЛЬКО api + её зависимости ИЗ ЛОКАЛЬНОГО pnpm-store (bind-mount build-context
# `pnpmstore`), офлайн — npm-реестр под эмуляцией бывает недоступен/флаки.
# Сборка: docker buildx build --build-context pnpmstore="$(dirname "$(pnpm store path)")" ...
# (контекст = РОДИТЕЛЬ стора, внутри лежит vNN). rw — pnpm пишет метаданные эфемерно (в источник не пишет).
# package-import-method=copy — хардлинки через границу ФС нельзя.
RUN --mount=type=bind,from=pnpmstore,target=/pnpm-store,rw \
    pnpm install --frozen-lockfile --filter api... --offline \
      --store-dir /pnpm-store --package-import-method=copy
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api run build
# pruned prod-сборка только для api (включает prisma CLI + @prisma/client — они в deps).
# deploy --legacy переоткрывает зависимости и тянет метаданные из npm (офлайн тут не
# работает). npm-реестр под эмуляцией флаки → терпеливые таймауты + ретраи.
ENV npm_config_fetch_retries=6 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=180000 \
    npm_config_fetch_timeout=600000
RUN for i in 1 2 3 4 5 6; do \
      pnpm --filter api deploy --prod --legacy --ignore-scripts /app && break; \
      echo ">>> deploy attempt $i failed, retry in 15s"; sleep 15; \
    done; \
    test -d /app/node_modules
# собранный код + схема
RUN cp -r apps/api/dist /app/dist \
 && cp -r apps/api/prisma /app/prisma
# Prisma-клиент генерируем ВНУТРИ /app — попадёт в правильное место его node_modules
RUN cd /app && ./node_modules/.bin/prisma generate --schema prisma/schema.prisma

# ---------- runtime ----------
FROM node:22-slim AS runtime
# Chromium + шрифты (кириллица/латиница) — Puppeteer рендерит PDF Европротокола
# системным браузером, а не скачанным бандлом.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openssl ca-certificates \
      chromium \
      fonts-liberation fonts-dejavu-core fonts-noto-core \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production PORT=3030 \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY --from=build /app /app
EXPOSE 3030
# Миграции запускаем отдельным K8s Job (см. deploy/k8s/api.yaml):
#   node_modules/.bin/prisma migrate deploy
CMD ["node", "dist/src/main.js"]
