# Deployment Guide - Hostinger VPS

## Architecture

- **DEV**: `./start-all.sh` on local machine (localhost, mkcert certs)
- **PRE/PRO**: `./deploy.sh` on Hostinger VPS (real domain, Let's Encrypt auto-SSL)

In PRE/PRO, frontend and backend run via **PM2**, while infrastructure (PostgreSQL, Redis, Elasticsearch, MinIO, Zitadel, Caddy) runs via **Docker Compose**. Caddy automatically obtains and renews SSL certificates via Let's Encrypt — no manual configuration needed.

---

## First-Time VPS Setup

### 1. Install system dependencies

```bash
sudo apt update && sudo apt install -y \
    docker.io docker-compose-v2 \
    git nodejs npm \
    gettext-base

sudo npm install -g pm2
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone repository

```bash
git clone <repo-url> /opt/realstate
cd /opt/realstate
```

### 3. Configure environment

```bash
# Infrastructure (passwords, domain, SSL mode)
cp infra/.env.example infra/.env
nano infra/.env
```

Set these values in `infra/.env`:
```
APP_ENV=PRO
DOMAIN=yourdomain.com
SSL_MODE=letsencrypt
POSTGRES_PASSWORD=<strong-password>
MINIO_ROOT_PASSWORD=<strong-password>
ZITADEL_MASTERKEY=<32-char-key>      # see below
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

```bash
# Frontend
cp web/.env.example web/.env.local
nano web/.env.local
# Set: NEXTAUTH_URL=https://yourdomain.com
# Set: NEXTAUTH_SECRET=<random-hex>

# Backend
cp backend/.env.example backend/.env
# Set passwords to match infra/.env
```

### 4. Generate secrets

```bash
# ZITADEL_MASTERKEY (exactly 32 chars)
openssl rand -base64 32 | tr -d '=+/' | head -c 32

# NEXTAUTH_SECRET
openssl rand -hex 32

# Strong passwords
openssl rand -base64 24
```

### 5. Configure Google OAuth (optional)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add authorized redirect URIs:
- `https://yourdomain.com/api/auth/callback/google`
- `https://yourdomain.com/idps/callback`

### 6. Open firewall ports

Ports required:
- **80** — HTTP (Let's Encrypt ACME challenge)
- **443** — HTTPS (main application)

### 7. Point DNS to your VPS

Create an A record: `yourdomain.com` → `<VPS IP>`

Wait for DNS propagation before deploying (check with `dig yourdomain.com`).

### 8. Deploy

```bash
cd /opt/realstate
./deploy.sh
```

Caddy will automatically obtain SSL certificates on first run.

---

## Subsequent Deployments

```bash
cd /opt/realstate
./deploy.sh
```

---

## Database Backups

```bash
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
mkdir -p "$BACKUP_DIR"
docker exec realstate-postgres pg_dump -U postgres realstate | \
    gzip > "$BACKUP_DIR/realstate-$(date +%Y%m%d-%H%M%S).sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
EOF
chmod +x /opt/backup-db.sh

# Schedule daily at 3am
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/backup-db.sh") | crontab -
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| SSL certificate not issued | Ensure port 80 is open and DNS points to VPS |
| Auth fails after deploy | Check `ZITADEL_ISSUER` in backend/.env matches actual domain |
| Zitadel "client not found" | `rm infra/.zitadel-configured && ./infra/setup-zitadel.sh` |
| Port 3000/3002 in use | `pm2 delete all && pm2 start ecosystem.config.js` |
| Docker volumes lost | `rm infra/.zitadel-configured` then redeploy |
