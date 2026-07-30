#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

DOMAIN="${DOMAIN:-complaint.mom.gov.et}"
EMAIL="admin@${DOMAIN}" # Change this if desired
RSA_KEY_SIZE=4096
DATA_PATH="./certbot"

echo "=========================================================="
echo " Starting Let's Encrypt Bootstrap for: $DOMAIN"
echo "=========================================================="

if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  read -p "Existing data found for $DOMAIN. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit 0
  fi
fi

echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $EMAIL \
    -d $DOMAIN \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

echo "### Restarting nginx to activate HTTPS (PRODUCTION MODE) ..."
docker compose restart nginx

echo "### Done! Verify that HTTPS is working."
