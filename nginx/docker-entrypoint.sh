#!/bin/sh
set -e

DOMAIN="${DOMAIN:-complaint.mom.gov.et}"
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

echo "[nginx] Starting entrypoint for domain: ${DOMAIN}"

if [ ! -f "$CERT" ] || [ ! -f "$KEY" ]; then
  echo "================================================================"
  echo " Let's Encrypt certificates not found for ${DOMAIN}!"
  echo " Nginx will now start in BOOTSTRAP MODE (HTTP only)."
  echo " You MUST run ./init-letsencrypt.sh to obtain the certificates."
  echo "================================================================"
  
  # Use envsubst to replace only ${DOMAIN}
  # we export DOMAIN so envsubst can see it
  export DOMAIN
  envsubst '${DOMAIN}' < /etc/nginx/templates/nginx.conf.bootstrap > /etc/nginx/conf.d/default.conf
else
  echo "[nginx] Certificates found. Starting in PRODUCTION MODE."
  export DOMAIN
  envsubst '${DOMAIN}' < /etc/nginx/templates/nginx.conf.production > /etc/nginx/conf.d/default.conf
fi

echo "[nginx] Testing configuration..."
nginx -t

exec "$@"
