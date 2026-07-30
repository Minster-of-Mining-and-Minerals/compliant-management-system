#!/bin/sh
# Certbot entrypoint
# - Issues a certificate on the very first run (no cert exists yet)
# - Waits for Nginx to be ready before issuing
# - Runs a renewal loop every 12 hours after that

DOMAIN="${CERTBOT_DOMAIN:-www.mom.gov.et}"
EMAIL="${CERTBOT_EMAIL}"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

# ── Validate required env var ─────────────────────────────────────────────────
if [ -z "$EMAIL" ]; then
    echo "[certbot] ERROR: CERTBOT_EMAIL environment variable is not set."
    echo "[certbot] Add CERTBOT_EMAIL=your@email.com to your .env file."
    exit 1
fi

# ── First-time certificate issuance ───────────────────────────────────────────
if [ ! -f "$CERT_PATH" ]; then
    echo "[certbot] ================================================"
    echo "[certbot] No certificate found for ${DOMAIN}."
    echo "[certbot] Obtaining initial SSL certificate..."
    echo "[certbot] ================================================"

    # Wait for nginx to be available on port 80
    echo "[certbot] Waiting for Nginx to be ready on port 80..."
    until wget -q -O /dev/null "http://nginx/" 2>/dev/null; do
        echo "[certbot] Nginx not ready yet. Retrying in 3 seconds..."
        sleep 3
    done
    echo "[certbot] Nginx is ready!"

    certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "${DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    echo "[certbot] ================================================"
    echo "[certbot] SSL certificate issued successfully!"
    echo "[certbot] Nginx will now switch to HTTPS automatically."
    echo "[certbot] ================================================"
fi

# ── Auto-renewal loop (every 12 hours) ───────────────────────────────────────
echo "[certbot] Starting auto-renewal loop (checks every 12 hours)..."
trap exit TERM
while :; do
    certbot renew || echo "[certbot] Renewal attempt failed. Will retry in 12 hours."
    sleep 12h &
    wait ${!}
done
