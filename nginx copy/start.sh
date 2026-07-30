#!/bin/sh
# Nginx startup script
# - Starts in HTTP-only mode if no SSL cert exists yet
# - Waits for Certbot to issue the certificate
# - Switches to HTTPS mode automatically
# - Reloads every 6 hours to pick up renewed certs

set -e

DOMAIN="www.mom.gov.et"
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

# ── Select initial config based on cert existence ──────────────────────────────
if [ ! -f "$CERT" ]; then
    echo "[nginx] No SSL certificate found."
    echo "[nginx] Starting in HTTP-only mode for initial certificate issuance..."
    cp /etc/nginx/nginx-http.conf /etc/nginx/conf.d/default.conf
else
    echo "[nginx] SSL certificate found. Starting in HTTPS mode..."
    cp /etc/nginx/nginx-https.conf /etc/nginx/conf.d/default.conf
fi

# ── Start nginx in the background ─────────────────────────────────────────────
nginx -g "daemon off;" &
NGINX_PID=$!

# ── If HTTP-only mode: wait for cert, then switch to HTTPS ────────────────────
if [ ! -f "$CERT" ]; then
    echo "[nginx] Waiting for Certbot to issue SSL certificate..."
    while [ ! -f "$CERT" ]; do
        sleep 5
    done
    echo "[nginx] Certificate obtained! Switching to HTTPS mode..."
    sleep 2  # allow certbot to finish writing all cert files
    cp /etc/nginx/nginx-https.conf /etc/nginx/conf.d/default.conf
    nginx -s reload
    echo "[nginx] Now running in HTTPS mode."
fi

# ── Reload every 6 hours to pick up renewed certificates ──────────────────────
while kill -0 "$NGINX_PID" 2>/dev/null; do
    sleep 6h &
    wait $!
    echo "[nginx] Reloading to pick up any renewed SSL certificates..."
    nginx -s reload
done
