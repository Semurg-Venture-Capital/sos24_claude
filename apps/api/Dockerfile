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
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    npm_config_fetch_timeout=300000 \
    npm_config_fetch_retries=6 \
    npm_config_fetch_retry_maxtimeout=120000
WORKDIR /repo
COPY . .
# Ставим ТОЛЬКО api + её workspace-зависимости (не тянем RN/Expo/Next всего монорепо).
RUN pnpm install --frozen-lockfile --filter api...
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api run build
# pruned prod-сборка только для api (включает prisma CLI + @prisma/client — они в deps)
RUN pnpm --filter api deploy --prod --legacy --ignore-scripts /app
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
