# DEPLOY.md — Боевой деплой SOS24 (первый прод под TestFlight)

> Прагматичный минимум для запуска API + admin на K8s, доступных снаружи через nginx-ВМ.
> Полный таргет (Harbor / ArgoCD / Vault / Patroni / мониторинг) — в `DEVOPS.md`, наращиваем позже.

## Схема

```
Интернет → [белый IP] nginx-ВМ (TLS Let's Encrypt)
   ├─ https://api.sos24.uz   → http://<K8S_NODE_IP>:30030  (NodePort)
   └─ https://admin.sos24.uz → http://<K8S_NODE_IP>:30035  (NodePort)

K8s namespace sos24-dev (создан DevOps):
   ├─ Deployment sos24-api   (NodePort 30030)  NestJS :3030
   ├─ Deployment sos24-admin (NodePort 30035)  Next.js :3035
   └─ Job sos24-api-migrate  (prisma migrate deploy)
PostgreSQL — уже поднят DevOps в кластере (postgresql.sos24-dev.svc), адрес в Secret DATABASE_URL.
```

## Окружение от DevOps (2026-06-11)
- **Кластер:** RKE2, **3 control-plane ноды в HA** — `10.10.38.11/12/13` (etcd-кворум 3/3,
  apiserver:6443 на всех; «главного-одного» нет). NodePort открыт на всех трёх.
  SSH только по ключу (парольный вход отключён); kubeconfig от DevOps → `~/.kube/config`.
- **Namespace:** `sos24-dev`
- **Registry (insecure):** `10.10.38.11:30500` → образы пушим как `10.10.38.11:30500/sos24/<svc>`.
  Локальный Docker Desktop: добавить в `insecure-registries` → `["10.10.38.11:30500"]`.
- **Postgres:** `postgresql.sos24-dev.svc.cluster.local:5432`, db/user `sos24`, пароль `Sos24DB@2026`.
  В `DATABASE_URL` пароль кодируем: `@`→`%40` → `...sos24:Sos24DB%402026@postgresql...`.
- **Redis:** поднят (`redis-master.sos24-dev.svc`), но API его пока НЕ использует.

## Артефакты в репо
- `apps/api/Dockerfile`, `apps/admin/Dockerfile` — образы (контекст сборки = корень репо).
- `deploy/k8s/` — namespace, secret.example, api, admin.
- `deploy/nginx/sos24.conf` — конфиг внешнего nginx.

---

## Шаг 0 — что нужно заранее
- `kubectl` с доступом к кластеру (kubeconfig от сисадмина).
- `DATABASE_URL` от поднятого Postgres (адрес, достижимый из подов кластера).
- 2 домена: `api.sos24.uz`, `admin.sos24.uz` → A-записи на белый IP nginx-ВМ.
- Registry (ghcr.io / Harbor / Docker Hub) — куда пушим образы.
- IP любого узла кластера (`K8S_NODE_IP`) — NodePort открыт на всех узлах.

## Шаг 1 — собрать и запушить образы
> Контекст сборки — КОРЕНЬ репо. `NEXT_PUBLIC_API_URL` для admin вшивается на этапе сборки.

```bash
# registry DevOps (insecure, без авторизации)
export REG=10.10.38.11:30500/sos24

# API ставит зависимости ОФЛАЙН из локального pnpm-store (npm-реестр под эмуляцией флаки).
# Обязательно передать build-context `pnpmstore` = РОДИТЕЛЬ стора (внутри лежит vNN).
# Используем обычный `docker build` (НЕ `buildx build` — он без --load не кладёт образ в стор,
# и docker push отправит старый локальный :latest).
docker build --platform linux/amd64 \
  --build-context pnpmstore="$(dirname "$(pnpm store path)")" \
  -f apps/api/Dockerfile -t $REG/sos24-api:latest .

# admin тоже ставит зависимости офлайн из pnpm-store → нужен тот же --build-context pnpmstore
docker build --platform linux/amd64 \
       --build-context pnpmstore="$(dirname "$(pnpm store path)")" \
       -f apps/admin/Dockerfile -t $REG/sos24-admin:latest \
       --build-arg NEXT_PUBLIC_API_URL=https://api.sos24.uz .
docker push $REG/sos24-api:latest
docker push $REG/sos24-admin:latest
```
> Образы — `linux/amd64`. Узлы кластера (containerd) знают про insecure-registry `10.10.38.11:30500`.
> ⚠️ Если npm-реестр доступен и стабилен — можно вернуть онлайн-install, но офлайн надёжнее.

## Шаг 2 — секреты и манифесты
> Registry insecure и без авторизации → imagePullSecret НЕ нужен.
> В манифестах строки `imagePullSecrets:` / `- name: sos24-registry` можно удалить (помечены комментарием).

```bash
kubectl apply -f deploy/k8s/namespace.yaml   # sos24-dev уже создан DevOps — apply идемпотентен

# секреты приложения
cp deploy/k8s/secret.example.yaml deploy/k8s/secret.yaml   # заполнить реальные значения!
kubectl apply -f deploy/k8s/secret.yaml

# подставить registry в манифесты и применить
sed "s#__REGISTRY__#$REG#g" deploy/k8s/api.yaml   | kubectl apply -f -
sed "s#__REGISTRY__#$REG#g" deploy/k8s/admin.yaml | kubectl apply -f -
```
Миграции применит Job `sos24-api-migrate` автоматически. Проверка:
```bash
kubectl -n sos24-dev get pods,svc,job
kubectl -n sos24-dev logs job/sos24-api-migrate
```

## Шаг 2.5 — MinIO (хранилище файлов Европротокола)
> Self-hosted S3 для фото/видео/схем ДТП и PDF-извещений. Доступ только изнутри кластера
> (ClusterIP `minio.sos24-dev.svc:9000`) — наружу не выставляем. Бакет (`MINIO_BUCKET`) создаётся
> автоматически при старте API (`MinioService.ensureBucket`).

В `secret.yaml` (из примера) уже есть **два** секрета: `sos24-api-secret` (с `MINIO_ACCESS_KEY/SECRET_KEY`)
и `sos24-minio-secret` (root-креды сервера). **Они должны совпадать:**
`MINIO_ACCESS_KEY = MINIO_ROOT_USER`, `MINIO_SECRET_KEY = MINIO_ROOT_PASSWORD` (пароль ≥ 8 символов).

```bash
kubectl apply -f deploy/k8s/secret.yaml      # содержит и sos24-minio-secret
kubectl apply -f deploy/k8s/minio.yaml       # PVC (20Gi local-path) + Deployment + ClusterIP Service
kubectl -n sos24-dev rollout status deploy/sos24-minio
# проверка изнутри кластера:
kubectl -n sos24-dev exec deploy/sos24-api -- wget -qO- http://minio:9000/minio/health/ready && echo OK
```
> PVC `local-path` привязывается к одной ноде → стратегия Deployment = `Recreate`.
> Консоль MinIO (:9001) наружу не выставлена; при необходимости — `kubectl port-forward svc/minio 9001:9001`.

## Шаг 3 — внешний nginx (ВМ с белым IP)
> **Развёрнуто 2026-06-11.** nginx-ВМ `10.10.38.30` (nginx-quic 1.30.2, HTTP/3+geoip2),
> белый IP `146.120.18.70`, домены `api.sos24.uz`/`admin.sos24.uz` (SSL уже был).
> Реально применённые конфиги — `deploy/nginx/live/` (upstream на 3 ноды + proxy_pass в NodePort).
> Оригиналы забэкаплены на ВМ в `/etc/nginx/conf.d/backup-<ts>/`.
```bash
# 1) скопировать конфиг, заменить K8S_NODE_IP и домены
sudo cp deploy/nginx/sos24.conf /etc/nginx/conf.d/sos24.conf
sudo sed -i 's/K8S_NODE_IP/<IP узла кластера>/' /etc/nginx/conf.d/sos24.conf

# 2) сначала открыть 80 (для ACME), получить сертификаты
sudo certbot --nginx -d api.sos24.uz -d admin.sos24.uz

# 3) проверить и перезапустить
sudo nginx -t && sudo systemctl reload nginx
```

## Шаг 4 — проверка
```bash
curl https://api.sos24.uz/partners            # публичный эндпоинт → 200 + JSON
open https://admin.sos24.uz                   # логин админки
```

## Шаг 5 — переключить мобильное приложение на прод
В `apps/mobile/src/api/client.ts` сейчас захардкожен LAN-IP (`DEV_API_HOST`).
Для прод/TestFlight-сборки API-URL = `https://api.sos24.uz` (по HTTPS, иначе iOS ATS заблокирует).
→ см. отдельную задачу «env-конфиг API-хоста» (dev LAN / prod HTTPS) перед сборкой в TestFlight.

---

## Шаг 6 — B2B-кабинет партнёров `partner.sos24.uz` (добавлен 2026-06-24)
> 3-е веб-приложение (`apps/partner`, Next.js standalone, порт 3036, NodePort 30040). Образ собирается
> так же, как admin (офлайн pnpm-store + `--build-arg NEXT_PUBLIC_API_URL`). DNS A-запись
> `partner.sos24.uz → 146.120.18.70` должна существовать ДО выпуска SSL.

```bash
export REG=10.10.38.11:30500/sos24
# 1) образ
docker build --platform linux/amd64 --build-context pnpmstore="$(dirname "$(pnpm store path)")" \
  -f apps/partner/Dockerfile -t $REG/sos24-partner:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.sos24.uz .
docker push $REG/sos24-partner:latest
# 2) k8s
sed "s#__REGISTRY__#$REG#g" deploy/k8s/partner.yaml | kubectl apply -f -
kubectl -n sos24-dev rollout status deploy/sos24-partner
```

**nginx + SSL (на ВМ `sos24-nginx`, certbot НЕ установлен — используется acme.sh у root, Google CA):**
```bash
# upstream sos24_partner (NodePort 30040) уже в deploy/nginx/live/sos24-upstreams.conf
scp deploy/nginx/live/sos24-upstreams.conf sos24-nginx:/tmp/
ssh sos24-nginx 'sudo cp /tmp/sos24-upstreams.conf /etc/nginx/conf.d/'
# 1) временный :80-vhost (только acme-challenge + redirect) — иначе nginx -t падает на отсутствующем cert
#    (default.conf НЕ обслуживает /.well-known/acme-challenge для чужого host)
# 2) выпуск (webroot /var/www/_acme-challenge, ec-256):
ssh sos24-nginx 'sudo /root/.acme.sh/acme.sh --issue -d partner.sos24.uz -w /var/www/_acme-challenge \
  --server https://dv.acme-v02.api.pki.goog/directory --keylength ec-256'
# 3) install-cert (кладёт в /etc/nginx/ssl/partner.sos24.uz/ + ставит авто-renew с reloadcmd):
ssh sos24-nginx 'sudo /root/.acme.sh/acme.sh --install-cert -d partner.sos24.uz --ecc \
  --fullchain-file /etc/nginx/ssl/partner.sos24.uz/fullchain.pem \
  --key-file /etc/nginx/ssl/partner.sos24.uz/key.pem \
  --reloadcmd "nginx -t && systemctl reload nginx"'
# 4) полный vhost (:80+:443):
scp deploy/nginx/live/partner.sos24.uz.conf sos24-nginx:/tmp/
ssh sos24-nginx 'sudo cp /tmp/partner.sos24.uz.conf /etc/nginx/conf.d/ && sudo nginx -t && sudo systemctl reload nginx'
```
> Партнёрских аккаунтов в проде нет — создаются в админке: Пользователи → роль **Партнёр** → привязать к
> страховой компании ИЛИ точке-партнёру (1:1). Партнёр логинится на partner.sos24.uz тем же OTP-флоу.

## Заметки
- **HTTPS обязателен** для мобильного приложения (iOS ATS не пускает http к не-localhost).
- **CORS** API сейчас `origin:true` (любой источник). При желании сузить до `https://admin.sos24.uz`.
- **Seed** (`prisma db seed`) в прод НЕ запускаем — только миграции. Тестовых данных в проде нет.
- **НАПП prod** (`erspapiv2.e-osgo.uz`) — нужен whitelist IP сервера у НАПП (см. STAGE1 S14).
- **Обновление версии (rollout):**
  ```bash
  export REG=10.10.38.11:30500/sos24
  docker build --platform linux/amd64 --build-context pnpmstore="$(dirname "$(pnpm store path)")" \
    -f apps/api/Dockerfile -t $REG/sos24-api:latest .
  docker push $REG/sos24-api:latest
  # тег latest не меняет spec → принудительно перезапускаем под:
  kubectl -n sos24-dev rollout restart deploy/sos24-api
  kubectl -n sos24-dev rollout status  deploy/sos24-api
  # миграции (Job нельзя apply'ить поверх — пересоздаём):
  kubectl -n sos24-dev delete job sos24-api-migrate --ignore-not-found
  sed "s#__REGISTRY__#$REG#g" deploy/k8s/api.yaml | kubectl apply -f -
  kubectl -n sos24-dev logs job/sos24-api-migrate -f
  ```
  > Для воспроизводимости лучше тегировать образ версией (`:2026-06-16`) и `set image deploy/sos24-api api=$REG/sos24-api:<tag>`.
- **PDF Европротокола:** образ API содержит системный Chromium (`/usr/bin/chromium`, env `PUPPETEER_EXECUTABLE_PATH`) — отдельная установка не нужна.
- **Следующие шаги инфры** (`DEVOPS.md`): Harbor (registry+scan), ArgoCD (GitOps), Vault (секреты), Patroni (HA Postgres), мониторинг.
