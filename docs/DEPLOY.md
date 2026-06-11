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
docker build -f apps/api/Dockerfile   -t $REG/sos24-api:latest .
docker build -f apps/admin/Dockerfile -t $REG/sos24-admin:latest \
       --build-arg NEXT_PUBLIC_API_URL=https://api.sos24.uz .
docker push $REG/sos24-api:latest
docker push $REG/sos24-admin:latest
```
> Образы — `linux/amd64` (если собираешь на Apple Silicon, добавь `--platform linux/amd64`).
> Узлы кластера (containerd) должны знать про insecure-registry `10.10.38.11:30500` — это настройка DevOps.

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

## Заметки
- **HTTPS обязателен** для мобильного приложения (iOS ATS не пускает http к не-localhost).
- **CORS** API сейчас `origin:true` (любой источник). При желании сузить до `https://admin.sos24.uz`.
- **Seed** (`prisma db seed`) в прод НЕ запускаем — только миграции. Тестовых данных в проде нет.
- **НАПП prod** (`erspapiv2.e-osgo.uz`) — нужен whitelist IP сервера у НАПП (см. STAGE1 S14).
- **Обновление версии:** пересобрать образ с новым тегом → `kubectl -n sos24-dev set image deploy/sos24-api api=$REG/sos24-api:<tag>` (и admin). Миграции — повторно запустить Job.
- **Следующие шаги инфры** (`DEVOPS.md`): Harbor (registry+scan), ArgoCD (GitOps), Vault (секреты), Patroni (HA Postgres), мониторинг.
