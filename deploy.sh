#!/bin/bash
# Deploy script for Hostinger VPS (PRE or PRO environment)
# Run on the VPS after initial setup. See DEPLOYMENT.md for first-time setup.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"
BACKEND_DIR="$PROJECT_DIR/backend"
WEB_DIR="$PROJECT_DIR/web"

source "$PROJECT_DIR/lib/common.sh"
detect_docker_compose

# Deploy-specific aliases that match the original deploy.sh style
print_ok()      { print_success "$1"; }
print_info()    { print_message "$1"; }
print_warn()    { print_warning "$1"; }

# Load environment
if [ ! -f "$INFRA_DIR/.env" ]; then
    print_error "infra/.env not found. Create it from infra/.env.example"
    exit 1
fi

set -a && source "$INFRA_DIR/.env" && set +a

APP_ENV="${APP_ENV:-PRO}"
DOMAIN="${DOMAIN:-localhost}"
SSL_MODE="${SSL_MODE:-letsencrypt}"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║         Real Estate Platform Deploy           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
print_info "Environment: ${APP_ENV} → https://${DOMAIN}"
echo ""

# Step 1: Pull latest code
print_info "Pas 1/8: Pulling latest code..."
git pull origin master
print_ok "Code updated"

# Step 2: Install backend dependencies
print_info "Pas 2/8: Installing dependencies..."
cd "$BACKEND_DIR" && npm ci --omit=dev
cd "$WEB_DIR" && npm ci
print_ok "Dependencies installed"

# Step 3: Build frontend
print_info "Pas 3/8: Building frontend..."
cd "$WEB_DIR" && npm run build
print_ok "Frontend built"

# Step 4: Generate Caddyfile from template
print_info "Pas 4/8: Generating Caddyfile..."
if ! command -v envsubst >/dev/null 2>&1; then
    print_error "envsubst not found. Run: apt install gettext-base"
    exit 1
fi
envsubst < "$INFRA_DIR/caddy/Caddyfile.prod" > "$INFRA_DIR/caddy/Caddyfile"
print_ok "Caddyfile generated (Let's Encrypt mode, domain: ${DOMAIN})"

# Step 5: Start/update Docker services
print_info "Pas 5/8: Starting Docker services..."
cd "$INFRA_DIR"
$DOCKER_COMPOSE pull
$DOCKER_COMPOSE up -d --remove-orphans
print_ok "Docker services running"

# Step 6: Wait for services
print_info "Pas 6/8: Waiting for services to be healthy..."
sleep 15

# Step 7: Run Zitadel setup (idempotent)
print_info "Pas 7/8: Configuring Zitadel..."
if [ ! -f "$INFRA_DIR/.zitadel-configured" ]; then
    bash "$INFRA_DIR/setup-zitadel.sh"
    $DOCKER_COMPOSE restart zitadel-login
    print_ok "Zitadel configured"
else
    print_ok "Zitadel already configured (skipping)"
fi

# Step 8: Run DB migrations + seed
print_info "Pas 8/8: Running database migrations..."
cd "$BACKEND_DIR"
npm run prisma:migrate -- --name "deploy-$(date +%Y%m%d)" 2>/dev/null || \
    npx prisma migrate deploy
print_ok "Migrations applied"

# Seed (first time only — uses a flag file to skip on subsequent deploys)
if [ ! -f "$PROJECT_DIR/.db-seeded" ]; then
    print_info "Seeding database (first time)..."
    cd "$BACKEND_DIR" && npx prisma db seed
    touch "$PROJECT_DIR/.db-seeded"
    print_ok "Database seeded"
else
    print_ok "Database already seeded (skipping)"
fi

# Start/restart application with PM2
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "realstate"; then
        pm2 reload ecosystem.config.js
        print_ok "PM2 processes reloaded"
    else
        pm2 start "$PROJECT_DIR/ecosystem.config.js"
        pm2 save
        print_ok "PM2 processes started"
    fi
else
    print_warn "PM2 not found. Install with: npm install -g pm2"
    print_warn "Then start manually: pm2 start ecosystem.config.js"
fi

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║         Deployment Complete!                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo -e "  ${GREEN}•${NC} Frontend:  https://${DOMAIN}"
echo -e "  ${GREEN}•${NC} API:       https://${DOMAIN}/api/health"
echo ""
