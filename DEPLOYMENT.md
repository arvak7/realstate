# Deployment Guide - Hostinger VPS

## Architecture

- **DEV**: `./start-all.sh` on local machine (localhost, mkcert certs)
- **PRE/PRO**: `./deploy.sh` on Hostinger VPS (real domain, Let's Encrypt)

In PRE/PRO, frontend and backend run via **PM2** (process manager), while infrastructure services (PostgreSQL, Redis, Elasticsearch, MinIO, Zitadel, Caddy) run via **Docker Compose**.

---

## First-Time VPS Setup

### 1. Install system dependencies

```bash
sudo apt update && sudo apt install -y \
    docker.io docker-compose-v2 \
    git nodejs npm \
    gettext-base          # provides envsubst for Caddyfile generation

sudo npm install -g pm2

# Add your user to docker group (or run as root)
sudo usermod -aG docker $USER
```

### 2. Clone repository

```bash
git clone <repo-url> /opt/realstate
cd /opt/realstate
```

### 3. Configure environment

```bash
# Infrastructure config (passwords, domain, SSL mode)
cp infra/.env.example infra/.env
nano infra/.env
# Set: APP_ENV=PRO, DOMAIN=yourdomain.com, SSL_MODE=letsencrypt
# Set: POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, ZITADEL_MASTERKEY (see below)
# Set: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (optional)

# Frontend config
cp web/.env.example web/.env.local
nano web/.env.local
# Set: NEXTAUTH_URL=https://yourdomain.com
# Set: NEXTAUTH_SECRET (generate below)
# Note: ZITADEL_CLIENT_ID/SECRET will be auto-filled by setup-zitadel.sh

# Backend config
cp backend/.env.example backend/.env
nano backend/.env
# Set passwords to match infra/.env values
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

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- Add authorized redirect URIs:
  - `https://yourdomain.com/api/auth/callback/google`
  - `https://yourdomain.com/idps/callback`

### 6. Open firewall ports

```bash
# Required ports:
# 80   - HTTP (needed for Let's Encrypt ACME challenge)
# 443  - HTTPS (main application)
# 8443 - Zitadel OIDC API (optional, for direct access)
```

### 7. Deploy

```bash
cd /opt/realstate
./deploy.sh
```

---

## Subsequent Deployments

```bash
cd /opt/realstate
./deploy.sh
```

---

## Zitadel After Docker Volume Reset

If Zitadel data is lost (Docker volumes deleted):

```bash
rm infra/.zitadel-configured
# edit infra/.env: keep the SAME ZITADEL_MASTERKEY as before if you have DB data
# if DB was also reset, generate a new ZITADEL_MASTERKEY
./infra/setup-zitadel.sh
```

---

## Database Backups

Set up automated daily backups:

```bash
# Create backup script
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/postgres"
mkdir -p "$BACKUP_DIR"
docker exec realstate-postgres pg_dump -U postgres realstate | \
    gzip > "$BACKUP_DIR/realstate-$(date +%Y%m%d-%H%M%S).sql.gz"
# Keep last 30 days
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
| Let's Encrypt fails | Ensure port 80 is open and domain DNS points to VPS |
| Auth fails after deploy | Check `ZITADEL_ISSUER` in backend/.env matches actual issuer |
| Zitadel "client not found" | `rm infra/.zitadel-configured && ./infra/setup-zitadel.sh` |
| Port 3000/3002 in use | `pm2 delete all && pm2 start ecosystem.config.js` |
| Docker volumes lost | See "Zitadel After Docker Volume Reset" above |
