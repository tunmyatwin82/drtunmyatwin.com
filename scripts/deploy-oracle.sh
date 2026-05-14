#!/usr/bin/env bash
# Redeploy drtunmyatwin-website on Oracle VM (Docker).
# Usage:
#   ORACLE_HOST=138.2.67.33 ORACLE_KEY=~/path/to/ssh-key.key ./scripts/deploy-oracle.sh
set -euo pipefail
ORACLE_HOST="${ORACLE_HOST:-138.2.67.33}"
ORACLE_USER="${ORACLE_USER:-ubuntu}"
ORACLE_KEY="${ORACLE_KEY:-${HOME}/Desktop/tunmyatwin/oracle-ssh/ssh-key.key}}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/drtunmyatwin-website}"
NETWORK="${NETWORK:-drtunmyatwin-website_default}"

chmod 600 "${ORACLE_KEY}" 2>/dev/null || true

ssh -o BatchMode=yes -i "${ORACLE_KEY}" "${ORACLE_USER}@${ORACLE_HOST}" bash -s <<REMOTE
set -euo pipefail
cd "${REMOTE_DIR}"
cp -a .env /tmp/drtunmyatwin.env.bak.deploy
git remote set-url origin https://github.com/tunmyatwin82/drtunmyatwin.com.git
git fetch origin
git reset --hard origin/main
cp -a /tmp/drtunmyatwin.env.bak.deploy .env
npm ci
npm run build
TAG="drtunmyatwin-website:\$(date +%Y-%m-%d)-\$(git rev-parse --short HEAD)"
docker build -f Dockerfile.deploy -t "\$TAG" -t drtunmyatwin-website:latest .
docker stop drtunmyatwin-website || true
docker rm drtunmyatwin-website || true
docker run -d --name drtunmyatwin-website \\
  --network ${NETWORK} \\
  --restart unless-stopped \\
  --env-file "${REMOTE_DIR}/.env" \\
  -e NODE_ENV=production \\
  -e PORT=80 \\
  "\$TAG"
sleep 2
IP=\$(docker inspect drtunmyatwin-website --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}")
curl -sS -m 10 "http://\${IP}/api/health"
echo
docker ps --filter name=drtunmyatwin-website --format "{{.Names}} {{.Image}} {{.Status}}"
REMOTE
