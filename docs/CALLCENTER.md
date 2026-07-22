# CALLCENTER.md — Колл-центр (Asterisk/FreePBX + ARI/AMI)

> Рабочее место оператора в админке SOS24: приём внешних звонков 24/7, запись разговоров,
> screen-pop клиента, заявка по звонку, очередь (ACD) со статусом оператора.
> **Статус: Фаза 1 функционально готова и проверена на живых звонках (dev).** Прод-связность открыта.
>
> Этот файл — **операционный справочник + болевые точки**. Если что-то сломалось или меняем
> SIP — начинать отсюда. Память Claude: `project-call-center`. Вопросы к клиенту: `QUESTIONS.md` разд.14.

---

## 1. Как это работает (архитектура)

```
[Мобильный / город] ──PSTN──► транк ──► Asterisk/FreePBX ──► Очередь 7000 (ACD) ──► оператор
                                          │  MixMonitor: запись          (браузер-софтфон SIP.js/WSS)
                                          │  события ARI (subscribeAll) + AMI
                                          ▼
                                  NestJS apps/api/src/call-center
                                    • журнал Call + screen-pop (Socket.IO /calls → панель)
                                    • очередь/пауза (AMI), запись→MinIO presign, заявка→SupportTicket
```

**Ключевое решение:** медиа-соединение оператор↔клиент и запись делает **нативная FreePBX-очередь
(ACD + MixMonitor)** — мы НЕ пишем свой ARI-бридж. Бэкенд только **наблюдает** события (`subscribeAll`)
и ведёт журнал/screen-pop/запись/заявку. Меньше кода, надёжнее, используем штатный FreePBX.

**Что готово (Фаза 1):** софтфон оператора (приём+звук), журнал+screen-pop реальных звонков, запись→MinIO+
прослушивание, заявка из звонка (омниканальность с Поддержкой), очередь ACD + статус «Доступен/Перерыв»,
персональный extension на оператора. **Фаза 2 (не начато):** звонки из мобильного приложения (WebRTC, screen-pop по userId, через Stasis).

---

## 2. Карта компонентов (код)

**Бэкенд** `apps/api/src/call-center/`:
- `ari.service.ts` — ARI-клиент (ws+fetch): события `/ari/events?subscribeAll=true`, REST (answer/hangup/getChannelVar), авто-реконнект, молчит без env.
- `ami.service.ts` — AMI-клиент (TCP 5038): `QueueSummary` (ожидающие/доступные), `QueuePause` (перерыв). ARI очереди app_queue не отдаёт → отдельный AMI.
- `call-center.service.ts` — журнал `Call` по событиям (ChannelCreated→Up→Destroyed), screen-pop (`User.phone`/`SOS24_USER_ID`), запись (читает `MIXMONITOR_FILENAME`, presign из REC_S3), заявка (`createTicketFromCall`), очередь/пауза, sip-credentials (персональные).
- `call-center.gateway.ts` — Socket.IO namespace `/calls` (операторам: `call:incoming`/`call:update`), JWT в handshake.
- `call-center.controller.ts` — `/admin/call-center/*` (health, calls, recording, ticket POST/PATCH, sip-credentials, queue, operator/pause), guard SUPPORT|ADMIN.
- модель `Call` (миграция `call_center`); `User.sipExtension/sipSecret` (миграция `operator_sip`).

**Админка** `apps/admin/src/`:
- `app/(dashboard)/call-center/page.tsx` — панель: журнал, входящие (screen-pop), «В очереди», тумблер «Доступен/Перерыв», «Прослушать», «Заявка».
- `.../SoftphoneBar.tsx` — софтфон (регистрация/приём/сброс/mute/таймер).
- `.../CallTicketModal.tsx` — заявка по звонку.
- `lib/softphone.ts` — обёртка SIP.js (WSS, recvonly-фолбэк, guard от двойного accept).
- `lib/callcenter.ts` — REST-хуки + socket `/calls`.
- В «Пользователях» (`UserFormModal`) — поля SIP-extension/secret для SUPPORT/ADMIN.

---

## 3. Переменные окружения (apps/api/.env → прод: k8s secret)

| Переменная | Значение (dev=прод) | Назначение |
|---|---|---|
| `ASTERISK_ARI_URL` | `http://10.10.10.30:8088` | ARI REST/WS |
| `ASTERISK_ARI_APP` | **dev:** `sos24-callcenter-dev` · **прод:** `sos24-callcenter` | имя Stasis-приложения (см. болевую точку #12) |
| `ASTERISK_ARI_USER` / `ASTERISK_ARI_PASSWORD` | `sos24cc` / см. `/root/.sos24_ari_cred` | ARI-логин |
| `ASTERISK_AMI_HOST` / `PORT` | `10.10.10.30` / `5038` | AMI |
| `ASTERISK_AMI_USER` / `ASTERISK_AMI_PASSWORD` | `sos24cc` / см. `/root/.sos24_ami_cred` | AMI-логин |
| `ASTERISK_QUEUE` | `7000` | номер очереди |
| `ASTERISK_TRUNK_PREFIX` | `PJSIP/2050855` | по нему ловим входящий с транка |
| `ASTERISK_WSS_URL` | `wss://sip.semurginsurance.uz:8089/ws` | софтфон (по FQDN! см. #2) |
| `ASTERISK_SIP_DOMAIN` | `sip.semurginsurance.uz` | SIP-домен в URI |
| `ASTERISK_TEST_SIP_EXT` / `ASTERISK_TEST_SIP_SECRET` | `102` / секрет | общий extension-фолбэк (если у оператора не задан персональный) |
| `REC_S3_ENDPOINT` … `REC_S3_SECRET_KEY` | `s3.sos24.uz` / bucket `sos24` / prefix `call-recordings` / key `sos24` / секрет | хранилище записей (прод-MinIO; presign локальный → работает и из dev) |

Секреты в чат не пишем; значения — в `apps/api/.env` (gitignored) и `/root/.sos24_*` на Asterisk.

---

## 4. Что настроено на Asterisk (FreePBX 12.13 / Asterisk 20.18.2 @ 10.10.10.30)

Доступ: `ssh -i ~/.ssh/sos24_nodes root@10.10.10.30`. ⚠️ FreePBX-managed — править через GUI / `*_custom.conf` / БД + `fwconsole reload`, не managed-файлы.

- **ARI** включён: `ari_general_custom.conf` (`enabled=yes`), юзер `sos24cc` в `ari_additional_custom.conf`. Порты 8088 (http) / 8089 (https). Креды `/root/.sos24_ari_cred`.
- **AMI** юзер `sos24cc` в `manager_custom.conf` (read=call,agent,user; write=call,agent,originate). Порт 5038. Креды `/root/.sos24_ami_cred`.
- **Очередь `7000`** «Поддержка SOS24», стратегия ringall, член — extension **102** (`Local/102@from-queue/n`), fail-over = Hangup.
- **Входящий маршрут** = **Any DID → Queue 7000** (провайдер шлёт DID как `s`, см. #4).
- **Транк** PJSIP `2050855` зарегистрирован на upstream `sip:10.10.0.3:5060` (провайдер `nano.voip`).
- **Запись** включена на входящем маршруте (Call Recording = Force) → MixMonitor пишет в `/var/spool/asterisk/monitor`.
- **Аплоадер записей** `/usr/local/bin/sos24-rec-upload.py` (исходник в репо `deploy/asterisk/`), cron 1/мин, конфиг `/root/.sos24_rec_s3.conf`, состояние `/var/lib/sos24-rec/uploaded.txt`, лог `/var/log/sos24-rec.log` → MinIO `s3.sos24.uz` ключ `call-recordings/<basename>`.
- **Firewall** (`/etc/firewall-4.rules`, root:root 600): `-I INPUT 1 -s 10.10.38.0/24 -p tcp -m multiport --dports 8088,5038 -j ACCEPT` — доступ кластера к ARI/AMI. Доверенные сети FreePBX (`fpbxnets`→zone-trusted): 10.10.10.0/24, 192.168.13.0/24 (dev-Mac), 172.28.140.0/24.
- **Extension оператора 102** — WebRTC (webrtc=yes, transport=wss, dtls/ice/avpf), включён копированием webrtc-полей из 1114 в БД `sip` + `fwconsole reload`.
- **Тест-контексты** (убрать при финализации): `[sos24-cc-test]` (Stasis), `[sos24-cc-playtest]` (Answer/Playback/MOH) в `extensions_custom.conf`.

---

## 5. Заведение оператора (per-operator extension)

1. **FreePBX GUI → Applications → Extensions → Add PJSIP Extension**: номер (напр. `103`), secret, на вкладке Advanced включить **WebRTC = Yes**. Submit → Apply Config. *(Если WebRTC-тумблер не сработал — скопировать webrtc-поля из рабочего extension в БД `sip` + `fwconsole reload`, см. как делали для 102.)*
2. **FreePBX → Queues 7000** → добавить extension в члены очереди.
3. **Админка → Пользователи** → у оператора (роль SUPPORT/ADMIN) вписать **SIP extension + secret**.
4. Оператор логинится в админку → раздел «Колл-центр» → софтфон регистрируется под его номером.

---

## 6. Runbook

**Dev (локально):** `pnpm dev:api` (Mac достаёт Asterisk через свой WG), `pnpm exec next dev -p 3035` в `apps/admin`. На dev-Mac в `/etc/hosts`: `10.10.10.30 sip.semurginsurance.uz`. `ASTERISK_ARI_APP=sos24-callcenter-dev`.

**Прод-деплой:** добавить все `ASTERISK_*`/`REC_S3_*` в `deploy/k8s/secret.yaml` (`ASTERISK_ARI_APP=sos24-callcenter`); собрать+запушить `sos24-api`+`sos24-admin` (см. `docs/DEPLOY.md`); миграции (`call_center`, `operator_sip`) применит Job; rollout. Asterisk-сторона (очередь/маршрут/запись/аплоадер/firewall) уже настроена — она общая. Прод-связность кластер→Asterisk: правило firewall #8 уже стоит.

---

## 7. БОЛЕВЫЕ ТОЧКИ (симптом → причина → лечение)

1. **ARI WS виснет на upgrade (timeout), а REST и SIP-WS `/ws` работают; в панели «АТС офлайн».** Причина: остались мёртвые ARI-сессии (бэкенд убили `kill -9`, WS не закрылся). `res_ari` не выгружается, `res_http_websocket` не reload-ится. Лечение: **рестарт Asterisk** — `fwconsole restart` (если виснет в shutdown: `pkill -9 -x asterisk` + `fwconsole start`). **Профилактика:** бэкенд останавливать через SIGTERM (graceful), не `kill -9`.

2. **Софтфон: `WebSocket connection to 'wss://...:8089/ws' failed`.** Причина: сертификат на 8089 — валидный Let's Encrypt на **FQDN `sip.semurginsurance.uz`**, при коннекте по IP браузер режет (name mismatch). Лечение: подключаться **по FQDN** (`ASTERISK_WSS_URL=wss://sip.semurginsurance.uz:8089/ws`); FQDN резолвится в 10.10.10.30, но WG-DNS на Mac его не отдаёт → добавить в `/etc/hosts`. На проде оператор должен резолвить FQDN в 10.10.10.30 (своя сеть/VPN).

3. **Звонок звонит на чужом устройстве, не в панели.** Причина: extension использует другой сервис/софтфон (так было с `1114`); звонок форкается на чужой контакт. Лечение: **свой выделенный extension на оператора**, не переиспользовать общие номера.

4. **С мобильного «number not in service», хотя звонок дошёл до Asterisk** (в логе INVITE есть, но контекст `from-trunk` exten `s` → играет `ss-noservice`). Причина: провайдер `nano.voip` НЕ передаёт цифры DID (Request-URI = `s`), маршрут по DID `2050855` не матчится. Лечение: входящий маршрут **«Any DID»** (пустой DID) → очередь. *(Если звонок вообще не доходит — проверить формат набора: ташкентский номер нужен с кодом 71.)*

5. **getUserMedia `NotFoundError: Requested device not found` при приёме.** Причина: на машине нет микрофона (Mac mini). Лечение: софтфон авто-отвечает в режиме **recvonly** (слышим, не передаём) — `answer()` проверяет `enumerateDevices`. Для двустороннего звука — гарнитура/микрофон.

5b. **На ПРОДЕ микрофон не работает: `Permissions policy violation: microphone is not allowed` / `NotAllowedError` (звонок звонит, но при «Принять» уходит 480).** Причина: nginx-vhost `admin.sos24.uz` ставил `Permissions-Policy: ... microphone=() ...` → политика блокирует микрофон всему документу (в dev/localhost этого заголовка нет — потому там работало). Лечение: в `deploy/nginx/live/admin.sos24.uz.conf` → `microphone=(self)`, scp на ВМ + `nginx -t && systemctl reload nginx`. Проверка: `curl -sI https://admin.sos24.uz/login | grep -i permissions-policy` → `microphone=(self)`.

6. **`Invalid session state Establishing` при приёме.** Причина: двойной вызов `accept()` (повторный клик, пока шла проверка микрофона). Лечение: в `softphone.answer()` guard — принимаем только из `Initial` и не дважды (уже сделано).

7. **Из пода/ноды кластера Asterisk недоступен (8088/5038 timeout), но ping идёт.** Причина: маршрут есть (DevOps), но **FreePBX-firewall** дропает TCP (сеть кластера не в zone-trusted; ICMP пропускает). Лечение: правило в `/etc/firewall-4.rules` (см. #4 п. firewall), `chmod 600` root:root, применить (`iptables -I INPUT 1 ...` + переживает `fwconsole firewall restart`).
   ⚠️ **Продолжение (важно):** после firewall TCP-handshake начал проходить, но **данные всё равно не шли** (HTTP→RST, AMI-баннер не приходит). Причина — **асимметричная маршрутизация**: кластер→Asterisk через шлюз `10.10.38.254`, а обратно Asterisk→кластер через `wg0`/`172.28.140.6`. Диагностика: из пода `node` HTTP GET к `/ari/asterisk/info` = TIMEOUT/ECONNRESET, AMI-баннер не приходит (хотя TCP `nc -z` = OPEN — handshake это малый пакет). Фикс — **у DevOps**: свести оба направления через один путь (OPNsense WireGuard, pf держит state). После фикса Asterisk видит кластер как **`172.28.140.1`** (NAT), а он уже в `zone-trusted` → правило `firewall-4.rules` для `10.10.38.0/24` становится **избыточным**. Проверка: из прод-пода AMI-баннер «Asterisk Call Manager» приходит, ARI GET = 401.

8. **Запись не появляется/«Прослушать» нет.** Проверить: запись включена на маршруте; `MIXMONITOR_FILENAME` читается (бэкенд пишет `recordingKey` при ответе); cron-аплоадер работает — `/var/log/sos24-rec.log`, конфиг `/root/.sos24_rec_s3.conf`. Частая ошибка: **InvalidAccessKeyId** — ключ MinIO должен быть `sos24` (= MINIO_ACCESS_KEY), не вся yaml-строка.

9. **Запись есть, но не играет в dev.** Записи лежат в **прод-MinIO `s3.sos24.uz`** (REC_S3_*), не в локальном dev-MinIO. Бэкенд presign'ит из REC_S3 (локально, сеть не нужна) — должно работать и из dev. Проверить REC_S3_* в `.env`.

10. **`QueuePause` не влияет на оператора.** Причина: интерфейс члена очереди в FreePBX — `Local/<ext>@from-queue/n`, не `PJSIP/<ext>`. Лечение: пауза по `Local/<ext>@from-queue/n` (уже сделано).

11. **Журнал/screen-pop задваивается или пропадает при работе dev+прод.** Причина: dev и прод-бэкенд подключились к **одному ARI-app** → `ApplicationReplaced` (второй вытесняет первого). Лечение: разные имена app — dev `sos24-callcenter-dev`, прод `sos24-callcenter` (subscribeAll у обоих, пишут в свои БД).

12. **`fwconsole restart` виснет («cannot be run during shutdown»).** Грейсфул-стоп залип. Лечение: `pkill -9 -x asterisk` (+ `pkill -9 -f safe_asterisk`), убедиться `pgrep -x asterisk` пуст, затем `fwconsole start`, ждать готовности (`asterisk -rx "core show version"`).

13. **`setRemoteDescription ... SDP without DTLS fingerprint`** (звонок звонит, при «Принять» уходит 480; offer от Asterisk = `m=audio ... RTP/AVP` без `a=fingerprint`/`SAVPF`). **РЕАЛЬНАЯ причина: extension оператора НЕ был WebRTC-включён** (`webrtc:no`, `media_encryption:no` → Asterisk отдаёт plain RTP/AVP, браузер требует DTLS-SRTP → отказ). Проверка: `pjsip show endpoint <ext> | grep -E "webrtc|media_encryption|transport"` — должно быть `webrtc:yes`, `media_encryption:dtls`, `transport:0.0.0.0-wss`. **Лечение:** включить WebRTC на extension (FreePBX GUI тумблер; если не применился — скопировать поля `avpf/icesupport/media_encryption/rtcp_mux/transport/webrtc` из рабочего webrtc-ext в БД `sip` + `fwconsole reload`). После этого **И прямой звонок, И очередь** (`Local/<ext>@from-queue/n`) отдают DTLS — **нативная FreePBX-очередь работает, прямые-PJSIP-члены/обходы НЕ нужны**.
    ⚠️ Изначально ошибочно списал на «Local/очередь рвёт DTLS» и временно вернул прямой маршрут — причина была не в этом, а в не-webrtc extension (105 завели через GUI без WebRTC). **Правило: каждый оператор-extension в очереди обязан быть WebRTC.** Прод-маршрут возвращён на очередь (`ext-queues,7000,1`).

14. **Односторонний звук: оператор в браузере не слышит абонента, абонент оператора слышит** — *(в работе 2026-06-25)*.

---

## 8. Как сменить SIP-провайдера / номер

1. **Транк** — FreePBX → Connectivity → Trunks: новый registration string / host / креды провайдера. Узнать у провайдера: реальный публичный номер (DID), **лимит одновременных каналов**, передаёт ли он цифры DID.
2. **Входящий маршрут** — если новый провайдер **передаёт DID** → создать маршрут с этим DID → очередь 7000; если **не передаёт** (как `nano.voip`) → оставить **Any DID** → очередь.
3. **Бэкенд env `ASTERISK_TRUNK_PREFIX`** → поменять на префикс имени канала нового транка (`PJSIP/<имя_транка>`), иначе входящий не определится в журнале. (Узнать имя: `asterisk -rx "pjsip show endpoints"` или `pjsip show registrations` при звонке.)
4. **Очередь / запись / операторы / firewall** — не меняются (привязаны к Asterisk, а не к провайдеру).
5. **WSS/cert** — если меняется FQDN Asterisk: обновить `ASTERISK_WSS_URL`/`ASTERISK_SIP_DOMAIN` + сертификат на 8089 + `/etc/hosts`/DNS.
6. **Если меняется сам сервер Asterisk** (другой IP) — обновить все `ASTERISK_*` (URL/HOST), пересоздать ARI/AMI-юзеров и firewall-правило на новом боксе, перенести аплоадер записей и cron, проверить связность из подов.

---

## 9. Публикация телефонии наружу (sip.sos24.uz) — план 2026-07-21

> Цель: софтфон оператора работает **откуда угодно** (не только из офисной сети / не только под WireGuard). Решения зафиксированы с пользователем: публичный IP — **146.120.18.70** (тот же, что api/admin), сигнализация WSS — **через nginx на 443**, медиа-траверс — **coturn с самого начала**.

### 9.1 Принцип: наружу выносим ТОЛЬКО 2 канала

| Канал | Порт | Наружу | Путь |
|---|---|---|---|
| **WSS (сигнализация)** | TCP **443** | ✅ | браузер → nginx(10.10.38.30):443 → **plain ws** `10.10.10.30:8088/ws` |
| **Медиа (RTP/DTLS-SRTP)** | через **coturn** | ✅ | браузер ↔ coturn ↔ Asterisk (ICE relay) |
| SIP-транк к провайдеру | 5060 | ❌ | исходящий коннект самой АТС |
| **ARI / AMI** | 8088(/ari) / 5038 | ❌ **никогда** | бэкенд ходит по внутренней сети/WG |
| SIP 5060 для клиентов | 5060 | ❌ | иначе SIP-сканеры / toll-fraud |

Важно: nginx терминирует TLS на 443 и проксирует **plain ws на 8088** (не на 8089) — двойного TLS нет, и нерабочий 8089 чинить не требуется. На публичном vhost проксируется **только `location /ws`** — `/ari` наружу не попадает.

### 9.2 DNS
- A-запись **`sip.sos24.uz` → 146.120.18.70** (регистратор домена sos24.uz). Отдельный FQDN от внутреннего `sip.semurginsurance.uz` (тот резолвится внутрь, на 10.10.10.30, — не трогаем).

### 9.3 nginx на 10.10.38.30 (уже держит api/admin, acme.sh есть) — ✅ СДЕЛАНО 2026-07-22
Выпущен cert (Google CA, ec-256, `/etc/nginx/ssl/sip.sos24.uz/`, авто-renew) и раскатан vhost `deploy/nginx/live/sip.sos24.uz.conf`. Проверено снаружи: `wss://sip.sos24.uz/ws` → `101 Switching Protocols` (`Sec-WebSocket-Protocol: sip`); `/` и `/ari/` → 404. Предусловие подтверждено: с nginx-ВМ `nc 10.10.10.30 8088/8089` = OK, Asterisk отдаёт `/ws` на 8088. Конфиг (для справки):
```nginx
server {
  listen 443 ssl http2;
  server_name sip.sos24.uz;
  ssl_certificate     /root/.acme.sh/sip.sos24.uz_ecc/fullchain.cer;
  ssl_certificate_key /root/.acme.sh/sip.sos24.uz_ecc/sip.sos24.uz.key;

  location /ws {
    proxy_pass http://10.10.10.30:8088;      # plain ws, внутренняя сеть/WG
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }
}
```
> ⚠️ Предусловие (вопрос сисадмину): **nginx-ВМ 10.10.38.30 должна маршрутизироваться до 10.10.10.30:8088** (через OPNsense/WG). Проверка: `nc -z 10.10.10.30 8088` с nginx-ВМ.

### 9.4 coturn (TURN/STUN) — гарантия медиа за любым NAT — ✅ ПОДНЯТ 2026-07-22
Поставлен на **nginx-ВМ 10.10.38.30** (coturn 4.6.1, Ubuntu 24.04). Слушает 3478 (udp/tcp) + 5349 (TLS) на 10.10.38.30; `external-ip=146.120.18.70/10.10.38.30`; `use-auth-secret` (секрет в `/etc/coturn/secret`, для эфемерных кредов); TLS-cert общий с nginx (`/etc/coturn/certs/*`, обновляется хуком `/usr/local/bin/sos24-cert-reload.sh` при acme-renew); анти-абьюз `denied-peer-ip` приватных сетей + `allowed-peer-ip=10.10.10.30` (релей только к Asterisk). ufw открыл 3478/5349/relay. `systemctl enable coturn`. Конфиг для справки:
```
listening-port=3478
tls-listening-port=5349
external-ip=146.120.18.70
realm=sip.sos24.uz
fingerprint
use-auth-secret
static-auth-secret=<СГЕНЕРИРОВАТЬ_ДЛИННЫЙ>   # эфемерные креды (TTL), не open-relay
min-port=49152
max-port=65535
# Диапазон полный; на OPNsense проброс исключает один порт 51820 (WireGuard) двумя правилами (см. 9.5).
# Шанс, что coturn выдаст relay ровно на 51820 (непроброшенный) — 1/16384, пренебрежимо.
cert=/root/.acme.sh/sip.sos24.uz_ecc/fullchain.cer
pkey=/root/.acme.sh/sip.sos24.uz_ecc/sip.sos24.uz.key
no-cli
# анти-абьюз: запрет relay в приватные диапазоны (кроме самой АТС при необходимости)
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
no-multicast-peers
```
Использовать **use-auth-secret** (временные креды с TTL), НЕ статического пользователя — иначе открытый релей утечёт и его заабьюзят.

### 9.5 OPNsense — NAT/port-forward (WAN, 146.120.18.70) — ⏳ ОСТАЛОСЬ (сисадмин)
Единственный оставшийся блок инфры. Проверено 2026-07-22: 3478/5349 снаружи CLOSED — проброса нет; 80/443 на 10.10.38.30 уже проброшены (по аналогии добавить coturn). Пробросить **только coturn**, цель — nginx-ВМ `10.10.38.30`, **порт-в-порт, без Source-NAT** (coturn должен видеть реальный IP клиента):
- `UDP 3478` → `10.10.38.30:3478`
- `TCP 3478` → `10.10.38.30:3478`
- `TCP 5349` → `10.10.38.30:5349`
- relay-диапазон **двумя правилами, исключая 51820** (порт WireGuard): `UDP 49152-51819` → `10.10.38.30:49152-51819` **и** `UDP 51821-65535` → `10.10.38.30:51821-65535`.

> 🔴 **ВАЖНО (ошибка, стоившая долгого разбора 2026-07-22): порт WireGuard 51820 попадает в 49152-65535.** WG-сервер живёт на OPNsense и слушает `51820/udp`. Исходное единое правило `UDP 49152-65535 → 10.10.38.30` **перехватывало 51820** и заворачивало WG-handshake на coturn (10.10.38.30) ⇒ **WireGuard переставал коннектиться у всех, кто ходит через белый IP** (handshake уходит, ответа нет: пакеты уходили на coturn, а не на WG-сервис). Симптом маскировался под «клиентскую» проблему (искали в конфиге/приложении на Mac). **Решение (сделано сисадмином):** пробросить relay **двумя правилами, вырезав 51820** — `49152-51819` + `51821-65535`. coturn оставлен на `49152-65535` (шанс попасть relay-ом ровно в 51820 = 1/16384, пренебрежимо). Правила 3478/5349 — отдельные, их это не касается.

НЕ пробрасывать 5060 / 8088 / 8089 / 5038. Firewall: рейт-лимит; по возможности гео-фильтр (только UZ). Проверка после проброса (с внешней машины): `openssl s_client -connect 146.120.18.70:5349` → cert `CN=sip.sos24.uz`. Asterisk RTP (10000-20000) наружу выставлять **не нужно** — медиа идёт через relay.

### 9.6 Asterisk — ICE + внешний адрес — ⏳ ОСТАЛОСЬ (сисадмин; ТЗ для Claude Code готово)
ТЗ для Claude Code на сервере FreePBX — `scratchpad/TASK_asterisk_ice.md` (правила: reload не restart, транк 2050855 не ронять, custom-файлы FreePBX). `rtp.conf` `[general]` (класть в `rtp_custom.conf`):
```
icesupport=yes
stunaddr=sip.sos24.uz:3478
turnaddr=sip.sos24.uz:3478
turnusername=2000000000:asterisk
turnpassword=STpvN6jdABjVf5wwSXjJpF2FgDM=
```
Внешний адрес: FreePBX `Settings → Asterisk SIP Settings → External Address = 146.120.19.155` — ⚠️ **это СОБСТВЕННЫЙ публичный/egress-адрес Asterisk, НЕ 146.120.18.70** (последний — DNAT на nginx-ВМ/coturn, туда RTP слать нельзя). Два белых IP: `146.120.18.70` = входящий (443+coturn→10.10.38.30), `146.120.19.155` = WAN-egress Asterisk. external_media_address=146.120.19.155 ещё и *необходим*: браузер создаёт на coturn TURN-permission для этого IP, и звук от Asterisk (выходящего под ним) проходит через relay браузера.

> 🔴 **STUN/TURN на Asterisk (`stunaddr/turnaddr`) — ОБЯЗАТЕЛЬНЫ (доказано живым тестом 2026-07-22).** Без них Asterisk отдаёт в SDP-offer только приватные host-кандидаты (`10.10.10.30`, `172.28.140.6`) → удалённый оператор голос НЕ слышит: coturn отбрасывает медиа от Asterisk, т.к. его реальный egress `146.120.19.155` не входит в разрешённые браузером кандидаты (браузер берёт permission-список из offer). С `stunaddr`/`turnaddr` Asterisk отдаёт srflx (`146.120.19.155`) / relay-кандидат через coturn → браузер разрешает → звук идёт. **Важно: `rtp show settings` = `0.0.0.0:0` означает, что они НЕ применились — `module reload` их не читает, нужен ПОЛНЫЙ рестарт Asterisk** (`fwconsole restart` в окно низкой нагрузки; stunaddr/turnaddr резолвятся при инициализации RTP-движка). После рестарта `rtp show settings` должен показать STUN/TURN-адрес.

> **TURN-кред Asterisk** (`turnusername`/`turnpassword`) — долгоживущий (схема coturn `use-auth-secret`, `username=<expiryUnix>:asterisk`, `credential=base64(HMAC-SHA1(TURN_SECRET, username))`), expiry `2000000000` (≈2033-05-18), проверен против coturn (allocate OK). Секрет-источник — `/etc/coturn/secret` на nginx-ВМ. ⚠️ coturn отклоняет слишком дальний expiry (год 2100 = `4102444800` не принят); держать expiry в разумном диапазоне.

### 9.7 Бэкенд/админка — ✅ КОД ГОТОВ 2026-07-22 (dev), прод-деплой ⏳ после проброса OPNsense
- dev-env (`apps/api/.env`): `ASTERISK_WSS_URL=wss://sip.sos24.uz/ws` (транспорт через nginx; `ASTERISK_SIP_DOMAIN` оставлен `sip.semurginsurance.uz` — меняется только точка входа); `TURN_HOST=sip.sos24.uz`, `TURN_SECRET=<из /etc/coturn/secret>`, `TURN_TTL_SEC=43200`.
- Бэкенд: `CallCenterService.sipCredentials()` теперь возвращает `iceServers` (STUN + TURN); эфемерные креды по схеме coturn `use-auth-secret` — `username=<expiryUnix>:<operatorId>`, `credential=base64(HMAC-SHA1(secret, username))` (`buildIceServers()`). Проверено против coturn: верный кред → allocate OK, неверный → 401.
- Софтфон (`apps/admin/src/lib/softphone.ts`): `SipCreds.iceServers` прокинуты в `UserAgent.sessionDescriptionHandlerFactoryOptions.peerConnectionConfiguration.iceServers` (`turn:...3478 udp/tcp`, `turns:...5349`).
- **Прод-деплой (осталось):** в k8s-секрет добавить `ASTERISK_WSS_URL`/`TURN_HOST`/`TURN_SECRET`/`TURN_TTL_SEC`, пересобрать образы api+admin, rollout. Делать вместе с тестом после проброса OPNsense (9.5), чтобы не деплоить дважды.

### 9.8 Безопасность (чек-лист)
- ✅ Наружу: только 443 (WSS) + coturn. ❌ 5060 / ARI / AMI — внутри.
- coturn: TLS(5349) + use-auth-secret + denied-peer-ip (не open-relay).
- Сильные SIP-secret на каждый extension; fail2ban на nginx `/ws`; гео-UZ на OPNsense.
- ARI/AMI остаются на внутренней сети/WG — бэкенд уже так ходит (проверено: ARI подключён).

### 9.9 Порядок запуска
1. Сисадмин: DNS `sip.sos24.uz`→146.120.18.70; cert; nginx vhost; coturn; OPNsense-проброс; Asterisk rtp/pjsip.
2. Проверка WSS: из внешней сети `wscat -c wss://sip.sos24.uz/ws` (должен подняться WebSocket).
3. Проверка TURN: `turnutils_uclient -T -u <user> -w <pass> sip.sos24.uz` или Trickle-ICE (webrtc.github.io/samples) с этим TURN.
4. Я: env + iceServers + эндпоинт TURN-креда → пере-деплой admin/api.
5. Тест звонка с устройства вне офисной сети (мобильный интернет).

---

## 10. Осталось / открытые вопросы

- ✅ **Прод задеплоен и подключён (2026-06-25):** образы api+admin, миграции `call_center`/`operator_sip`, секрет дополнен `ASTERISK_*`/`REC_S3_*` (прод ARI_APP=`sos24-callcenter`, dev=`sos24-callcenter-dev`); прод-бэкенд подключён к ARI+AMI, очередь читается. Связность кластер↔Asterisk DevOps решил (OPNsense WG, см. болевую точку #7).
- ✅ **Прод-софтфон рабочий (2026-06-25):** реальный звонок звонит в панели `admin.sos24.uz`, приём работает. Микрофон разрешён в nginx (#5b).
- ✅ **Очередь работает нативно (исправлено):** «webrtc+queue DTLS» оказался не проблемой Local/очереди, а **не-webrtc extension** (#13). Маршрут возвращён на **очередь 7000**; оба оператора (102, 105) сделаны WebRTC. Правило: каждый оператор-extension обязан быть WebRTC.
- ⏳ **Односторонний звук** (оператор не слышит абонента) — в работе (#14).
- Завести **реальных операторов**: WebRTC-extension в FreePBX + `sipExtension`/`secret` в админке. **Публичный доступ операторов откуда угодно — план в разделе 9** (sip.sos24.uz + nginx 443 + coturn); прежнее «только офисная сеть» заменяется.
- Атрибуция оператора на звонке (`operatorId` — кто принял).
- Fail-over очереди = Hangup → позже voicemail/announcement (24/7).
- Истинно эфемерные SIP-креды (сейчас персональные статические из БД) — потребует realtime-PJSIP-auth; пока не делаем.
- Убрать тест-контексты `sos24-cc-test`/`sos24-cc-playtest`.
- Фаза 2 — звонки из приложения.
- Открытые вопросы к клиенту/телеком — `QUESTIONS.md` разд.14 (юр-требования к записи, лимит каналов, режим 24/7).
