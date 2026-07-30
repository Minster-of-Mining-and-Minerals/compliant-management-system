#!/bin/sh
set -e

# Install ONLY curl to save memory (docker-cli is huge and causes Out-Of-Memory kills on small servers)
apk update && apk add --no-cache curl

DOMAIN="${DOMAIN:-complaint.mom.gov.et}"
EMAIL="${EMAIL:-admin@complaint.mom.gov.et}"
DATA_PATH="/etc/letsencrypt"
RSA_KEY_SIZE=4096

echo "[certbot] Waiting for nginx to be ready..."
# Wait up to 30 seconds for nginx to be responsive
for i in $(seq 1 15); do
  if curl -s http://nginx > /dev/null; then
    break
  fi
  sleep 2
done

if [ ! -f "$DATA_PATH/live/$DOMAIN/fullchain.pem" ]; then
  echo "[certbot] Certificates not found for $DOMAIN. Requesting initial certificate..."
  
  if certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --non-interactive; then
    
    echo "[certbot] Initial certificate requested successfully. Restarting nginx via Docker Socket..."
    curl -s -X POST --unix-socket /var/run/docker.sock http://localhost/containers/cms_nginx/restart
  else
    echo "[certbot] Failed to obtain initial certificate. Will try again later."
    # If it fails, we exit so the container can restart and try again
    exit 1
  fi
else
  echo "[certbot] Certificates found for $DOMAIN."
fi

# Start the renewal loop
echo "[certbot] Starting continuous renewal loop..."
while :; do
  # Use curl and the Docker socket to restart nginx, avoiding the need for the bulky docker-cli package
  certbot renew --webroot -w /var/www/certbot --deploy-hook "curl -s -X POST --unix-socket /var/run/docker.sock http://localhost/containers/cms_nginx/restart"
  sleep 12h
done
