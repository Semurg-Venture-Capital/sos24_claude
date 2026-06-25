# Asterisk-сторонние артефакты колл-центра

## sos24-rec-upload.py — заливка записей разговоров в MinIO
Скрипт на Asterisk-боксе (`/usr/local/bin/sos24-rec-upload.py`), по cron раз в минуту
заливает новые файлы из `/var/spool/asterisk/monitor` в MinIO (S3 SigV4, без boto3 —
только requests+hashlib) под ключ `call-recordings/<basename>`.

**Конфиг** (root-only) `/root/.sos24_rec_s3.conf` — те же `REC_S3_*`, что в `apps/api/.env`:
```
REC_S3_ENDPOINT=s3.sos24.uz
REC_S3_PORT=443
REC_S3_SSL=true
REC_S3_BUCKET=sos24
REC_S3_PREFIX=call-recordings
REC_S3_ACCESS_KEY=sos24
REC_S3_SECRET_KEY=<minio secret>
```
**Cron:** `* * * * * /usr/bin/python3 /usr/local/bin/sos24-rec-upload.py >> /var/log/sos24-rec.log 2>&1`
**Состояние:** `/var/lib/sos24-rec/uploaded.txt` (basename'ы уже залитых).

Бэкенд (`CallCenterService`) при ответе читает `MIXMONITOR_FILENAME` через ARI и пишет
`Call.recordingKey = call-recordings/<basename>`; `GET /admin/call-center/calls/:id/recording`
отдаёт presigned-ссылку (отдельный recordings-клиент на `REC_S3_*`).

Запись включается на входящем маршруте FreePBX (Call Recording = Force).
