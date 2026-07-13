# DEVOPS.md — Инфраструктура SOS24

> Инструкция для DevOps-инженера. Описывает архитектуру, стек, порядок развёртывания dev и production окружений на Kubernetes.
>
> **Последнее обновление:** 2026-06-03

---

## 1. Обзор инфраструктуры

### Что деплоим

| Сервис | Технология | Порт |
|---|---|---|
| Backend API | NestJS (Node 22) | 3030 |
| Admin Panel | Next.js 15 | 3035 |
| Landing | Next.js 15 | 3000 |
| Partner Cabinet | Next.js 15 | 3001 |

### Стек инфраструктуры

| Категория | Технология | Обоснование |
|---|---|---|
| K8s дистрибутив | **RKE2** | Hardened by default, CIS Benchmark, для финтех-нагрузки |
| CNI | **Cilium** | eBPF, Network Policies, встроенный mTLS, Hubble observability |
| Load Balancer | **MetalLB** | Bare-metal External IP для LoadBalancer сервисов |
| Ingress | **Ingress-NGINX** | Стандарт, стабилен |
| TLS | **cert-manager + Let's Encrypt** | Автоматические SSL-сертификаты |
| Registry | **Harbor** | Self-hosted, image scanning (Trivy), signing, RBAC |
| CI/CD | **GitHub Actions (self-hosted runner) + ArgoCD** | GitOps, rollback одной кнопкой |
| Secrets | **HashiCorp Vault** | Dynamic credentials, audit log, для платёжных данных |
| PostgreSQL | **Patroni** (вне K8s) | HA с автоматическим failover, PITR бэкапы |
| Redis | **Redis Sentinel** (Bitnami Helm, в K8s) | HA для кэша и очередей BullMQ |
| Object Storage | **MinIO** (вне K8s) | Фото ДТП, документы, distributed erasure coding |
| Метрики | **VictoriaMetrics + Grafana** | Эффективнее Prometheus по памяти в 5–10 раз |
| Логи | **Loki + Promtail** | Дешевле ELK, интеграция с Grafana |
| Алерты | **Alertmanager → Telegram** | Уведомления в Telegram-бот команды |
| Бэкап K8s | **Velero** | Бэкап volumes и state кластера |
| Бэкап БД | **WAL-G** | PITR — восстановление PostgreSQL на любую минуту |

---

## 2. Топология серверов

### Требования к серверам (минимум для старта)

| Роль | Кол-во | CPU | RAM | Диск | Назначение |
|---|---|---|---|---|---|
| Control Plane | **3** | 4 core | 8 GB | 50 GB SSD | etcd + K8s control plane |
| Worker (prod) | **3** | 8 core | 16 GB | 100 GB SSD | Production workloads |
| Infra Node | **1** | 4 core | 8 GB | 200 GB SSD | Harbor, ArgoCD, Vault, Monitoring |
| Dev Node | **1** | 4 core | 8 GB | 100 GB SSD | Dev окружение |
| DB Server | **3** | 8 core | 16 GB | 500 GB SSD | PostgreSQL Patroni + MinIO |

> **Важно:** 3 control plane ноды обязательны для etcd quorum (отказоустойчивость).  
> При потере одной ноды кластер продолжает работу.  
> При потере двух нод — split-brain, кластер встаёт.

### Сетевые требования

- Все ноды в одной L2 сети (MetalLB нужен L2 или BGP)
- Control Plane → Worker: порты 6443, 9345, 10250, 2379-2380
- Outbound интернет: для Let's Encrypt, GitHub, Docker Hub pull
- Зарезервировать диапазон IP для MetalLB (например, `192.168.1.200–192.168.1.220`)

---

## 3. Namespace структура

```
sos24-prod          ← Production: api, admin, landing, redis
sos24-dev           ← Dev/Staging: api, admin (уменьшенные ресурсы)
sos24-payments      ← Изолированный namespace платёжных сервисов
sos24-infra         ← Harbor, ArgoCD, Vault
sos24-monitoring    ← VictoriaMetrics, Grafana, Loki, Alertmanager
```

---

## 4. Порядок установки

### Шаг 1 — ОС и базовая подготовка (все ноды)

```bash
# Ubuntu 22.04 LTS рекомендуется
# Отключить swap (K8s требует)
swapoff -a
sed -i '/swap/d' /etc/fstab

# Настроить hostname (пример для control plane 1)
hostnamectl set-hostname rke2-cp1

# Внести все ноды в /etc/hosts на каждой ноде
cat >> /etc/hosts << EOF
192.168.1.10  rke2-cp1
192.168.1.11  rke2-cp2
192.168.1.12  rke2-cp3
192.168.1.20  rke2-worker1
192.168.1.21  rke2-worker2
192.168.1.22  rke2-worker3
192.168.1.30  rke2-infra
192.168.1.31  rke2-dev
EOF

# Firewall (разрешить нужные порты или отключить для начала)
ufw disable
```

---

### Шаг 2 — RKE2 Control Plane

```bash
# На первой control plane ноде (rke2-cp1)
curl -sfL https://get.rke2.io | sh -

mkdir -p /etc/rancher/rke2
cat > /etc/rancher/rke2/config.yaml << EOF
# Кластер с HA
cluster-init: true
tls-san:
  - 192.168.1.10    # IP cp1
  - 192.168.1.11    # IP cp2
  - 192.168.1.12    # IP cp3
  - rke2.sos24.uz   # DNS для kube API (опционально)
# Cilium вместо стандартного CNI
cni: cilium
disable:
  - rke2-canal      # отключаем Canal (стандартный CNI)
EOF

systemctl enable rke2-server.service
systemctl start rke2-server.service

# Ждать пока запустится (~2 мин)
journalctl -u rke2-server -f

# Получить токен для присоединения других нод
cat /var/lib/rancher/rke2/server/node-token
```

```bash
# На rke2-cp2 и rke2-cp3 (присоединение)
curl -sfL https://get.rke2.io | sh -

cat > /etc/rancher/rke2/config.yaml << EOF
server: https://192.168.1.10:9345
token: <TOKEN_FROM_CP1>
tls-san:
  - 192.168.1.10
  - 192.168.1.11
  - 192.168.1.12
cni: cilium
disable:
  - rke2-canal
EOF

systemctl enable rke2-server.service
systemctl start rke2-server.service
```

```bash
# Настроить kubectl (на cp1 или своей машине)
export KUBECONFIG=/etc/rancher/rke2/rke2.yaml
# Или скопировать на локальную машину
scp root@192.168.1.10:/etc/rancher/rke2/rke2.yaml ~/.kube/config
sed -i 's/127.0.0.1/192.168.1.10/' ~/.kube/config

kubectl get nodes   # должны видеть 3 control plane
```

---

### Шаг 3 — Worker ноды

```bash
# На каждой worker ноде
curl -sfL https://get.rke2.io | INSTALL_RKE2_TYPE="agent" sh -

cat > /etc/rancher/rke2/config.yaml << EOF
server: https://192.168.1.10:9345
token: <TOKEN_FROM_CP1>
# Метка для planировщика
node-label:
  - "role=worker"
EOF

systemctl enable rke2-agent.service
systemctl start rke2-agent.service
```

```bash
# Infra и Dev ноды — аналогично, но с другой меткой
# node-label:
#   - "role=infra"   # для infra ноды
#   - "role=dev"     # для dev ноды
```

---

### Шаг 4 — Helm

```bash
# Установить Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

---

### Шаг 5 — MetalLB (L2 режим)

```bash
helm repo add metallb https://metallb.github.io/metallb
helm repo update

helm install metallb metallb/metallb \
  --namespace metallb-system \
  --create-namespace

# Подождать пока поды запустятся
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/name=metallb \
  --timeout=90s

# Назначить диапазон IP (поменяй под свою сеть)
kubectl apply -f - << EOF
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: sos24-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.200-192.168.1.220
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: sos24-l2
  namespace: metallb-system
EOF
```

---

### Шаг 6 — Ingress-NGINX

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."role"=worker \
  --set controller.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[0].topologyKey=kubernetes.io/hostname

# Проверить — должен получить External IP из пула MetalLB
kubectl get svc -n ingress-nginx
```

---

### Шаг 7 — cert-manager

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Создать ClusterIssuer для Let's Encrypt
kubectl apply -f - << EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@sos24.uz
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

### Шаг 8 — Harbor (Self-hosted Registry)

```bash
helm repo add harbor https://helm.goharbor.io
helm repo update

# Создать namespace
kubectl create namespace harbor

# Создать values файл
cat > harbor-values.yaml << 'EOF'
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor-tls
  ingress:
    hosts:
      core: registry.sos24.uz
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod

externalURL: https://registry.sos24.uz

persistence:
  enabled: true
  persistentVolumeClaim:
    registry:
      size: 100Gi
    database:
      size: 20Gi
    redis:
      size: 5Gi

harborAdminPassword: "ЗАМЕНИ_НА_СИЛЬНЫЙ_ПАРОЛЬ"

nodeSelector:
  role: infra
EOF

helm install harbor harbor/harbor \
  --namespace harbor \
  --values harbor-values.yaml

# После установки: зайти на https://registry.sos24.uz
# Логин: admin / пароль из harborAdminPassword
# Создать проект "sos24" (private)
```

---

### Шаг 9 — ArgoCD

```bash
kubectl create namespace argocd

kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Ingress для ArgoCD UI
kubectl apply -f - << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  tls:
  - hosts:
    - argocd.sos24.uz
    secretName: argocd-tls
  rules:
  - host: argocd.sos24.uz
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 443
EOF

# Получить начальный пароль admin
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Зайти на https://argocd.sos24.uz и поменять пароль
```

---

### Шаг 10 — HashiCorp Vault

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

kubectl create namespace vault

cat > vault-values.yaml << 'EOF'
server:
  ha:
    enabled: true
    replicas: 3
    raft:
      enabled: true
  nodeSelector:
    role: infra
  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
    - host: vault.sos24.uz
      paths: ["/"]
    tls:
    - secretName: vault-tls
      hosts:
      - vault.sos24.uz

injector:
  enabled: true
EOF

helm install vault hashicorp/vault \
  --namespace vault \
  --values vault-values.yaml

# Инициализация Vault (выполнить один раз)
kubectl exec -n vault vault-0 -- vault operator init \
  -key-shares=5 \
  -key-threshold=3
# СОХРАНИТЬ: 5 unseal keys + root token в безопасном месте!

# Unseal (нужно 3 из 5 ключей)
kubectl exec -n vault vault-0 -- vault operator unseal <UNSEAL_KEY_1>
kubectl exec -n vault vault-0 -- vault operator unseal <UNSEAL_KEY_2>
kubectl exec -n vault vault-0 -- vault operator unseal <UNSEAL_KEY_3>
```

---

### Шаг 11 — Redis Sentinel (в K8s)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Для production
helm install redis bitnami/redis \
  --namespace sos24-prod \
  --create-namespace \
  --set architecture=replication \
  --set sentinel.enabled=true \
  --set sentinel.masterSet=sos24-master \
  --set replica.replicaCount=2 \
  --set auth.password="ЗАМЕНИ_НА_СИЛЬНЫЙ_ПАРОЛЬ" \
  --set nodeSelector.role=worker

# Для dev
helm install redis bitnami/redis \
  --namespace sos24-dev \
  --create-namespace \
  --set architecture=standalone \
  --set auth.password="dev-redis-password" \
  --set nodeSelector.role=dev
```

---

### Шаг 12 — PostgreSQL Patroni (вне K8s, на DB серверах)

> PostgreSQL ставится на отдельных VM, не в K8s. Это намеренное решение — финансовые данные не должны зависеть от сложности K8s-конфигурации.

```bash
# На каждом из 3 DB серверов
apt install -y postgresql-16 patroni etcd

# Конфигурация Patroni — пример для db1
cat > /etc/patroni/patroni.yaml << 'EOF'
scope: sos24-cluster
namespace: /db/
name: db1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 192.168.1.40:8008

etcd3:
  hosts:
    - 192.168.1.40:2379
    - 192.168.1.41:2379
    - 192.168.1.42:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
  pg_hba:
    - host replication replicator 0.0.0.0/0 md5
    - host all all 0.0.0.0/0 md5

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 192.168.1.40:5432
  data_dir: /var/lib/postgresql/16/main
  bin_dir: /usr/lib/postgresql/16/bin
  parameters:
    max_connections: 200
    shared_buffers: 4GB
    wal_level: replica
    max_wal_senders: 10
    max_replication_slots: 10
EOF

systemctl enable patroni
systemctl start patroni

# Проверить статус кластера
patronictl -c /etc/patroni/patroni.yaml list
```

```bash
# Настроить WAL-G для PITR бэкапов
# Бэкапы уходят в MinIO bucket "sos24-backups"
cat >> /etc/patroni/patroni.yaml << 'EOF'
  recovery_conf:
    restore_command: 'wal-g wal-fetch %f %p'
  callbacks:
    on_start: /usr/local/bin/wal-g-backup.sh
EOF

# Cron для базового бэкапа каждые 6 часов
echo "0 */6 * * * postgres /usr/local/bin/wal-g basebackup" | crontab -u postgres -
```

---

### Шаг 13 — Мониторинг (VictoriaMetrics + Grafana + Loki)

```bash
helm repo add vm https://victoriametrics.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create namespace sos24-monitoring

# VictoriaMetrics (single-node для старта, cluster для масштаба)
helm install victoria-metrics vm/victoria-metrics-single \
  --namespace sos24-monitoring \
  --set server.persistentVolume.size=50Gi \
  --set server.nodeSelector.role=infra \
  --set server.retentionPeriod=90d

# Grafana
helm install grafana grafana/grafana \
  --namespace sos24-monitoring \
  --set persistence.enabled=true \
  --set persistence.size=10Gi \
  --set nodeSelector.role=infra \
  --set ingress.enabled=true \
  --set ingress.annotations."kubernetes\.io/ingress\.class"=nginx \
  --set ingress.annotations."cert-manager\.io/cluster-issuer"=letsencrypt-prod \
  --set ingress.hosts[0]=grafana.sos24.uz \
  --set ingress.tls[0].secretName=grafana-tls \
  --set ingress.tls[0].hosts[0]=grafana.sos24.uz

# Loki (логи)
helm install loki grafana/loki-stack \
  --namespace sos24-monitoring \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=50Gi \
  --set promtail.enabled=true \
  --set nodeSelector.role=infra

# Alertmanager — настроить Telegram
kubectl apply -f - << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-config
  namespace: sos24-monitoring
stringData:
  alertmanager.yaml: |
    global:
      resolve_timeout: 5m
    route:
      receiver: telegram
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
    receivers:
    - name: telegram
      telegram_configs:
      - api_url: https://api.telegram.org
        bot_token: TELEGRAM_BOT_TOKEN
        chat_id: TELEGRAM_CHAT_ID
        message: '{{ .GroupLabels.alertname }}: {{ .CommonAnnotations.summary }}'
        parse_mode: HTML
EOF
```

---

### Шаг 14 — Namespaces и RBAC

```bash
# Создать namespaces
kubectl create namespace sos24-prod
kubectl create namespace sos24-dev
kubectl create namespace sos24-payments

# Node affinity: prod workloads только на prod workers
kubectl label nodes rke2-worker1 rke2-worker2 rke2-worker3 role=worker
kubectl label nodes rke2-infra role=infra
kubectl label nodes rke2-dev role=dev

# Network Policy: payments namespace изолирован
kubectl apply -f - << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payments-isolation
  namespace: sos24-payments
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: sos24-prod
  egress:
  - to:
    - ipBlock:
        cidr: 192.168.1.40/32  # PostgreSQL DB1
    - ipBlock:
        cidr: 192.168.1.41/32  # PostgreSQL DB2
    - ipBlock:
        cidr: 192.168.1.42/32  # PostgreSQL DB3
EOF
```

---

### Шаг 15 — ArgoCD Applications

```bash
# Подключить GitHub репозиторий к ArgoCD
# (через UI: Settings → Repositories → Connect Repo)
# URL: https://github.com/Semurg-Venture-Capital/sos24_claude
# Тип: HTTPS + GitHub Token (или SSH key)

# Application для dev
kubectl apply -f - << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sos24-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Semurg-Venture-Capital/sos24_claude
    targetRevision: develop
    path: k8s/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: sos24-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
EOF

# Application для production (manual sync — требует одобрения)
kubectl apply -f - << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sos24-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Semurg-Venture-Capital/sos24_claude
    targetRevision: main
    path: k8s/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: sos24-prod
  syncPolicy:
    automated:
      prune: false
      selfHeal: false  # production требует ручного подтверждения
EOF
```

---

## 5. CI/CD Pipeline

### GitHub Actions — Self-hosted Runner

```bash
# Установить runner на infra ноде
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz

# Зарегистрировать (токен взять в GitHub → Settings → Actions → Runners)
./config.sh \
  --url https://github.com/Semurg-Venture-Capital/sos24_claude \
  --token <RUNNER_TOKEN> \
  --labels self-hosted,linux,x64,sos24

./svc.sh install && ./svc.sh start
```

### Как работает pipeline

```
git push → develop     →  GitHub Actions
                            1. docker build api
                            2. docker push → registry.sos24.uz/sos24/api:sha-{commit}
                            3. Update k8s/dev/api-values.yaml (image tag)
                            4. git commit + push values
                           → ArgoCD auto-sync → sos24-dev namespace

git push → main (tag)  →  GitHub Actions
                            1. docker build api
                            2. docker push → registry.sos24.uz/sos24/api:v1.2.3
                            3. Update k8s/prod/api-values.yaml (image tag)
                            4. git commit + push values
                           → ArgoCD (manual approval в UI) → sos24-prod namespace
```

### ⚠️ ПРАВИЛО: НИКОГДА не деплоить по тегу `:latest`

> **Инцидент 2026-07-13 (реальный, стоил часа отладки).** Деплой шёл вручную на `:latest`
> (реестр `10.10.38.11:30500/sos24`). Симптом: `docker push` отрапортовал успех, migrate-Job
> запустился и написал **«33 migrations found → No pending migrations to apply»**, хотя в
> исходниках и внутри образа было **38** миграций. В прод-БД новых колонок не появилось
> (`partners.region`, `partners.healthDirectory`, `doctors.bookingEnabled`, `ai_usage_logs`),
> и API поехал бы на схеме без них.
>
> **Причина:** тег `:latest` в реестре указывал на **старый** образ — push прошёл частично
> («Layer already exists»), манифест `:latest` не переписался. `imagePullPolicy: Always` не
> спасает: он честно тянет `:latest`, а `:latest` — это старый digest. Диагностика: сравнить
> `kubectl get pod … -o jsonpath='{…imageID}'` (digest, который реально тянет под) с
> `docker inspect --format='{{index .RepoDigests 0}}' <образ>` — **они не совпали**.
>
> **Лечение и правило на будущее:** деплоить **только по уникальному неизменяемому тегу**
> (git-sha / версия). Тогда деплой детерминирован, а откат — это просто прошлый тег.

```bash
# Правильный ручной деплой (пока нет ArgoCD)
REG=10.10.38.11:30500/sos24
TAG="v$(date +%Y%m%d)-$(git rev-parse --short HEAD)"   # напр. v20260713-0a23537

# 1) Сборка под amd64. ВАЖНО: и api, и admin требуют --build-context pnpmstore=...
docker build --platform linux/amd64 \
  --build-context pnpmstore="$(dirname "$(pnpm store path)")" \
  -f apps/api/Dockerfile -t "$REG/sos24-api:$TAG" .
docker push "$REG/sos24-api:$TAG"

# 2) Проверить, что запушен ИМЕННО он (digest push == digest в реестре)
docker inspect --format='{{index .RepoDigests 0}}' "$REG/sos24-api:$TAG"

# 3) Миграции — Job на ТОМ ЖЕ теге (не :latest!)
kubectl delete job sos24-api-migrate -n sos24-dev --cascade=foreground --ignore-not-found
sed -e "s#__REGISTRY__#$REG#g" -e "s#sos24-api:latest#sos24-api:$TAG#g" deploy/k8s/api.yaml \
  | kubectl apply -n sos24-dev -f -   # (только kind: Job)
kubectl wait --for=condition=complete job/sos24-api-migrate -n sos24-dev --timeout=300s
kubectl logs job/sos24-api-migrate -n sos24-dev | grep -E "migrations found|Applying"

# 4) Rollout на том же теге
kubectl set image deploy/sos24-api  api="$REG/sos24-api:$TAG"   -n sos24-dev
kubectl set image deploy/sos24-admin admin="$REG/sos24-admin:$TAG" -n sos24-dev
kubectl rollout status deploy/sos24-api -n sos24-dev

# 5) Убедиться, что миграции реально применились (а не «No pending» на старом образе)
kubectl exec -n sos24-dev postgresql-0 -- env PGPASSWORD=<pass> \
  psql -U postgres -d sos24 -c "\d partners" | grep -E "region|healthDirectory"
```

**Чек-лист деплоя (не пропускать):**
1. Тег уникальный (git-sha), **не `:latest`**.
2. После push сверить digest локального образа с тем, что тянет под.
3. Migrate-Job — на том же теге; в логе Job'а должно быть **`Applying migration …`**, а не
   голое «No pending» (если миграции ожидались).
4. После Job'а — **проверить схему в БД** (колонки/таблицы на месте).
5. `kubectl logs job/...` читать у **свежего** пода: старый под Job'а может остаться и отдать
   лог прошлого запуска → удалять Job с `--cascade=foreground` и ждать исчезновения подов.

**Секреты приложения:** `sos24-api-secret` (namespace `sos24-dev`), правится `kubectl patch`:
```bash
kubectl patch secret sos24-api-secret -n sos24-dev --type merge \
  -p '{"stringData":{"TRIAGE_MODE":"llm","LLM_MODEL":"gemini-flash-lite-latest","GEMINI_API_KEY":"<key>"}}'
```
Ключи в git **не коммитим** (см. `deploy/k8s/secret.example.yaml` — только плейсхолдеры).
Изменение секрета применяется **только на новых подах** → после patch нужен rollout.

---

## 6. Secrets в Vault — структура

```
secret/
├── sos24/
│   ├── dev/
│   │   ├── database          # DATABASE_URL, credentials
│   │   ├── jwt               # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
│   │   ├── myid              # MYID_CLIENT_ID, MYID_CLIENT_SECRET, MYID_CLIENT_HASH
│   │   ├── redis             # REDIS_PASSWORD
│   │   └── storage           # MINIO_ACCESS_KEY, MINIO_SECRET_KEY
│   └── prod/
│       ├── database
│       ├── jwt
│       ├── myid
│       ├── redis
│       ├── storage
│       ├── payments/
│       │   ├── uzcard        # UZCARD_MERCHANT_ID, UZCARD_SECRET
│       │   ├── payme         # PAYME_MERCHANT_ID, PAYME_SECRET_KEY
│       │   └── click         # CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET
│       └── sms               # PLAYMOBILE_LOGIN, PLAYMOBILE_PASSWORD
```

---

## 7. Домены и DNS

| Домен | Куда смотрит | Namespace |
|---|---|---|
| `sos24.uz` | Landing | sos24-prod |
| `api.sos24.uz` | NestJS API | sos24-prod |
| `admin.sos24.uz` | Admin Panel | sos24-prod |
| `partner.sos24.uz` | Partner Cabinet | sos24-prod |
| `dev.sos24.uz` | Dev Landing | sos24-dev |
| `dev-api.sos24.uz` | Dev API | sos24-dev |
| `dev-admin.sos24.uz` | Dev Admin | sos24-dev |
| `registry.sos24.uz` | Harbor | sos24-infra |
| `argocd.sos24.uz` | ArgoCD UI | argocd |
| `vault.sos24.uz` | Vault UI | vault |
| `grafana.sos24.uz` | Grafana | sos24-monitoring |

> Все домены A-запись → External IP от MetalLB (ingress-nginx LoadBalancer).

---

## 8. Velero — бэкап K8s

```bash
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update

# Velero с MinIO как backend
helm install velero vmware-tanzu/velero \
  --namespace velero \
  --create-namespace \
  --set configuration.backupStorageLocation[0].name=default \
  --set configuration.backupStorageLocation[0].provider=aws \
  --set configuration.backupStorageLocation[0].bucket=sos24-k8s-backup \
  --set configuration.backupStorageLocation[0].config.region=us-east-1 \
  --set configuration.backupStorageLocation[0].config.s3ForcePathStyle=true \
  --set configuration.backupStorageLocation[0].config.s3Url=http://minio.sos24.uz:9000 \
  --set credentials.secretContents.cloud="[default]\naws_access_key_id=MINIO_KEY\naws_secret_access_key=MINIO_SECRET"

# Расписание: каждый день в 2:00 ночи
velero schedule create daily-backup \
  --schedule="0 2 * * *" \
  --ttl 720h  # хранить 30 дней
```

---

## 9. Checklist перед запуском production

### Инфраструктура
- [ ] RKE2 кластер: 3 control plane + 3 workers + infra + dev ноды
- [ ] Все ноды видят друг друга, kubelet healthy
- [ ] MetalLB выдаёт External IP
- [ ] Ingress-NGINX получил External IP
- [ ] cert-manager выпускает сертификаты для всех доменов
- [ ] Harbor доступен, проект `sos24` создан
- [ ] ArgoCD подключён к GitHub репо
- [ ] Vault инициализирован, все unseal keys сохранены в безопасном месте
- [ ] Redis Sentinel — 3 пода (1 master + 2 replica + sentinels)

### Базы данных
- [ ] PostgreSQL Patroni: primary + 2 standby, репликация работает
- [ ] `patronictl list` показывает Leader + Replica
- [ ] WAL-G настроен, тестовый бэкап ушёл в MinIO
- [ ] MinIO distributed mode, 4+ диска, erasure coding работает
- [ ] Тест восстановления PostgreSQL из бэкапа

### CI/CD
- [ ] Self-hosted runner зарегистрирован в GitHub
- [ ] Pipeline: push в develop → образ в Harbor → ArgoCD sync в dev
- [ ] Pipeline: push тега в main → образ в Harbor → ждёт approve → sync в prod

### Безопасность
- [ ] Все секреты в Vault, не в K8s Secrets / Git
- [ ] Network Policies для sos24-payments namespace
- [ ] Harbor image scanning включён (Trivy)
- [ ] TLS на всех публичных доменах

### Мониторинг
- [ ] Grafana доступна, источники данных (VictoriaMetrics, Loki) добавлены
- [ ] Дашборды: K8s overview, API latency, PostgreSQL, Redis
- [ ] Alertmanager → Telegram бот отправляет тестовый алерт
- [ ] node-exporter на всех нодах

### Приложение
- [ ] `GET /api-docs` → Swagger открывается (health check)
- [ ] `POST /auth/request-otp` → OTP отправляется через Playmobile
- [ ] Admin panel открывается, логин работает
- [ ] Логи в Loki (Grafana → Explore → Loki)

---

## 10. Контакты команды разработки

| Роль | Контакт |
|---|---|
| Тимлид / Backend | Telegram: @odilxon |
| Репозиторий | https://github.com/Semurg-Venture-Capital/sos24_claude |
| Swagger (dev) | http://dev-api.sos24.uz/api-docs |

### Полезные файлы репозитория

| Файл | Содержание |
|---|---|
| `CLAUDE.md` | Полный контекст проекта, стек, правила |
| `STAGE1.md` | Текущий статус разработки, что сделано |
| `DEVELOPMENT.md` | Команды, конвенции разработки |
| `PLAN.md` | Архитектура, модули, роадмап |
| `apps/api/.env` | Пример переменных окружения API |
| `docker-compose.yml` | PostgreSQL для локальной разработки |

---

> **Примечание для DevOps:** Helm values и K8s манифесты будут созданы командой разработки в папке `k8s/` по мере готовности. Пока их нет — сначала настрой инфраструктуру по этой инструкции, потом совместно разработаем pipeline.
