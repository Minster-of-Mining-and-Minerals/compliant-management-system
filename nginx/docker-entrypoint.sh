#!/bin/sh
set -e

SSL_DIR="/etc/nginx/ssl"
CERT="${SSL_DIR}/server.crt"
KEY="${SSL_DIR}/server.key"

APP_HOST="${APP_HOST:-172.31.102.108}"

mkdir -p "${SSL_DIR}"

if [ ! -f "${CERT}" ] || [ ! -f "${KEY}" ]; then
  echo "[nginx] Generating self-signed TLS certificate for ${APP_HOST}..."
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "${KEY}" \
    -out "${CERT}" \
    -subj "/CN=${APP_HOST}" \
    -addext "subjectAltName=IP:${APP_HOST},DNS:localhost"
  chmod 600 "${KEY}"
  chmod 644 "${CERT}"
fi

echo "[nginx] Testing configuration..."
nginx -t

exec "$@"
