#!/usr/bin/env bash
# Self-signed TLS certificate for IP-only deployment (no domain).
# Browsers will show a security warning until you add a real CA cert later.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"
mkdir -p "${SSL_DIR}"

PUBLIC_IP="197.156.80.36"
PRIVATE_IP="172.31.102.108"

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "${SSL_DIR}/server.key" \
  -out "${SSL_DIR}/server.crt" \
  -subj "/CN=${PUBLIC_IP}" \
  -addext "subjectAltName=IP:${PUBLIC_IP},IP:${PRIVATE_IP},DNS:localhost"

chmod 600 "${SSL_DIR}/server.key"
chmod 644 "${SSL_DIR}/server.crt"

echo "Created ${SSL_DIR}/server.crt and server.key"
echo "Run: docker compose up -d --build"
