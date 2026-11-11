#!/usr/bin/env bash
# ==============================================================================
# MindGuard AI — Automated AWS EC2 Cloud Bootstrap & Deployment Script
# Target OS: Ubuntu 22.04 LTS / 24.04 LTS on AWS EC2 (t3.medium or larger)
# ==============================================================================

set -euo pipefail
LOG_FILE="/var/log/mindguard_deploy.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo "[$(date -u)] === Starting MindGuard AI Automated AWS Deployment ==="

# 1. Update system packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw \
    nginx

# 2. Install Docker & Docker Compose Plugin
if ! command -v docker &>/dev/null; then
    echo "[$(date -u)] Installing Docker Engine..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable docker
systemctl start docker

# 3. Clone / Update MindGuardAI Codebase
INSTALL_DIR="/opt/mindguard"
if [ -d "${INSTALL_DIR}" ]; then
    echo "[$(date -u)] Updating existing repository in ${INSTALL_DIR}..."
    cd "${INSTALL_DIR}"
    git fetch origin
    git reset --hard origin/main
else
    echo "[$(date -u)] Cloning MindGuardAI from GitHub into ${INSTALL_DIR}..."
    git clone https://github.com/PASUPULASAITEJA/MindGuardAI.git "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
fi

# 4. Generate Production Environment Variables
echo "[$(date -u)] Configuring production .env..."
SECRET_KEY=$(openssl rand -hex 32)
cat <<EOF > "${INSTALL_DIR}/.env"
ENVIRONMENT=production
POSTGRES_USER=mindguard_admin
POSTGRES_PASSWORD=$(openssl rand -hex 16)
POSTGRES_DB=mindguard
DATABASE_URL=postgresql+asyncpg://mindguard_admin:${POSTGRES_PASSWORD}@db:5432/mindguard
JWT_SECRET_KEY=${SECRET_KEY}
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=14
CORS_ORIGINS=["*"]
VITE_API_URL=/api/v1
EOF

# 5. Configure Nginx Reverse Proxy on Port 80
echo "[$(date -u)] Setting up Nginx reverse proxy routing..."
cat <<'EOF' > /etc/nginx/sites-available/mindguard
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    # Frontend Single-Page Application
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API Endpoints & Swagger Docs
    location ~ ^/(api|docs|redoc|openapi.json|health) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/mindguard /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# 6. Launch All Docker Containers
echo "[$(date -u)] Building and starting MindGuard AI microservices..."
cd "${INSTALL_DIR}"
docker compose down --remove-orphans || true
docker compose up -d --build

# 7. Seed Initial Accounts & Historical Telemetry
echo "[$(date -u)] Waiting for PostgreSQL database and seeding accounts..."
sleep 15
docker compose exec -T api python -m app.initial_data || true

# 8. Configure Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 8000/tcp || true
echo "y" | ufw enable || true

# 9. Check Container Health
sleep 5
docker compose ps

echo "[$(date -u)] === MindGuard AI AWS Deployment Completed Successfully! ==="
echo "Access your portal via public IP: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 || curl -s ifconfig.me)/"
