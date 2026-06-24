#!/bin/sh
set -e

SSL_DIR="/etc/nginx/ssl"
CERT="${SSL_DIR}/server.crt"
KEY="${SSL_DIR}/server.key"

PUBLIC_IP="${PUBLIC_IP:-197.156.81.108}"
PRIVATE_IP="${PRIVATE_IP:-172.31.102.108}"

mkdir -p "${SSL_DIR}"

if [ ! -f "${CERT}" ] || [ ! -f "${KEY}" ]; then
  echo "[nginx] Generating self-signed TLS certificate for ${PUBLIC_IP}..."
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "${KEY}" \
    -out "${CERT}" \
    -subj "/CN=${PUBLIC_IP}" \
    -addext "subjectAltName=IP:${PUBLIC_IP},IP:${PRIVATE_IP},DNS:localhost"
  chmod 600 "${KEY}"
  chmod 644 "${CERT}"
fi

echo "[nginx] Testing configuration..."
nginx -t

exec "$@"
