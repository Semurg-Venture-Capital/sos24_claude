#!/usr/bin/env python3
# SOS24: заливка записей разговоров из FreePBX monitor-каталога в MinIO (S3 SigV4).
# Запускается по cron раз в минуту. Конфиг с кредами — /root/.sos24_rec_s3.conf (root-only).
import os, hashlib, hmac, datetime, glob
from urllib.parse import quote
import requests

CONF  = "/root/.sos24_rec_s3.conf"
STATE = "/var/lib/sos24-rec/uploaded.txt"
MONDIR= "/var/spool/asterisk/monitor"
MIN_AGE = 20  # сек: не заливаем файл, который ещё пишется (звонок идёт)

def load_conf():
    c = {}
    for line in open(CONF):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1); c[k.strip()] = v.strip()
    return c

def _sign(key, msg): return hmac.new(key, msg.encode(), hashlib.sha256).digest()

def sigv4(method, host, uri, payload_hash, ak, sk, region='us-east-1', service='s3'):
    now = datetime.datetime.utcnow()
    amz = now.strftime('%Y%m%dT%H%M%SZ'); day = now.strftime('%Y%m%d')
    ch = f'host:{host}\nx-amz-content-sha256:{payload_hash}\nx-amz-date:{amz}\n'
    sh = 'host;x-amz-content-sha256;x-amz-date'
    creq = f'{method}\n{uri}\n\n{ch}\n{sh}\n{payload_hash}'
    scope = f'{day}/{region}/{service}/aws4_request'
    sts = 'AWS4-HMAC-SHA256\n' + amz + '\n' + scope + '\n' + hashlib.sha256(creq.encode()).hexdigest()
    k = _sign(('AWS4' + sk).encode(), day); k = _sign(k, region); k = _sign(k, service); k = _sign(k, 'aws4_request')
    sig = hmac.new(k, sts.encode(), hashlib.sha256).hexdigest()
    return {
        'Authorization': f'AWS4-HMAC-SHA256 Credential={ak}/{scope}, SignedHeaders={sh}, Signature={sig}',
        'x-amz-date': amz, 'x-amz-content-sha256': payload_hash,
    }

def main():
    c = load_conf()
    host = c['REC_S3_ENDPOINT']; bucket = c['REC_S3_BUCKET']; prefix = c.get('REC_S3_PREFIX', 'call-recordings')
    ak = c['REC_S3_ACCESS_KEY']; sk = c['REC_S3_SECRET_KEY']
    ssl = c.get('REC_S3_SSL', 'true') != 'false'; port = c.get('REC_S3_PORT', '443')
    base = ('https' if ssl else 'http') + '://' + host + ('' if port in ('443', '80') else ':' + port)
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    done = set(open(STATE).read().split()) if os.path.exists(STATE) else set()
    now = datetime.datetime.now().timestamp()
    files = []
    for ext in ('wav', 'WAV', 'gsm', 'ulaw', 'sln', 'g722'):
        files += glob.glob(f'{MONDIR}/**/*.{ext}', recursive=True)
    changed = False
    for f in files:
        name = os.path.basename(f)
        if name in done: continue
        try:
            if now - os.path.getmtime(f) < MIN_AGE: continue
            data = open(f, 'rb').read()
        except OSError:
            continue
        ph = hashlib.sha256(data).hexdigest()
        uri = '/' + bucket + '/' + prefix + '/' + quote(name, safe='')
        r = requests.put(base + uri, data=data, headers=sigv4('PUT', host, uri, ph, ak, sk), timeout=60)
        if r.status_code in (200, 204):
            done.add(name); changed = True; print(f'[ok] {prefix}/{name}')
        else:
            print(f'[ERR {r.status_code}] {name}: {r.text[:160]}')
    if changed:
        open(STATE, 'w').write('\n'.join(sorted(done)))

if __name__ == '__main__':
    main()
