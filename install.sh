#!/bin/bash

# install.sh — First-time DEV setup for Real Estate Platform
# Run this ONCE on a fresh machine, then use ./start-all.sh daily.
#
# Usage: ./install.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"
BACKEND_DIR="$PROJECT_DIR/backend"
WEB_DIR="$PROJECT_DIR/web"

ok()   { echo -e "${GREEN}[install] ✓${NC} $1"; }
info() { echo -e "${BLUE}[install]${NC} $1"; }
warn() { echo -e "${YELLOW}[install] ⚠${NC} $1"; }
err()  { echo -e "${RED}[install] ✗${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Real Estate Platform — Install          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# ── Pas 1: Prerequisits ────────────────────────────────────────────
info "Pas 1/5: Comprovant prerequisits..."

if ! command -v node >/dev/null 2>&1; then
    err "Node.js no trobat. Instal·la'l via nvm: https://github.com/nvm-sh/nvm"
fi
NODE_VERSION=$(node --version | tr -d 'v' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    err "Node.js ${NODE_VERSION} és massa antic. Requerit: 18+. Usa: nvm install 20"
fi
ok "Node.js $(node --version)"

if ! command -v docker >/dev/null 2>&1; then
    err "Docker no trobat. Instal·la'l: https://docs.docker.com/get-docker/"
fi
ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

if ! command -v git >/dev/null 2>&1; then
    err "Git no trobat."
fi
ok "Git $(git --version | cut -d' ' -f3)"

# ── Pas 2: Instal·lar dependències npm ────────────────────────────
info "Pas 2/5: Instal·lant dependències npm..."

cd "$BACKEND_DIR" && npm install --silent
ok "Backend deps instal·lades"

cd "$WEB_DIR" && npm install --silent
ok "Web deps instal·lades"

# ── Pas 3: Crear fitxers .env si no existeixen ────────────────────
info "Pas 3/5: Configurant fitxers d'entorn..."

ENV_MISSING=false

if [ ! -f "$INFRA_DIR/.env" ]; then
    cp "$INFRA_DIR/.env.example" "$INFRA_DIR/.env"
    warn "Creat infra/.env (còpia del .env.example)"
    ENV_MISSING=true
else
    ok "infra/.env ja existeix"
fi

if [ ! -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    warn "Creat backend/.env (còpia del .env.example)"
    ENV_MISSING=true
else
    ok "backend/.env ja existeix"
fi

if [ ! -f "$WEB_DIR/.env.local" ]; then
    cp "$WEB_DIR/.env.example" "$WEB_DIR/.env.local"
    warn "Creat web/.env.local (còpia del .env.example)"
    ENV_MISSING=true
else
    ok "web/.env.local ja existeix"
fi

if [ "$ENV_MISSING" = true ]; then
    echo ""
    echo -e "${YELLOW}  ┌─────────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}  │  S'han creat fitxers .env amb valors per defecte.   │${NC}"
    echo -e "${YELLOW}  │  Per DEV local els valors per defecte ja funcionen. │${NC}"
    echo -e "${YELLOW}  │  Si vols Google OAuth, afegeix les credencials a:   │${NC}"
    echo -e "${YELLOW}  │    infra/.env  →  GOOGLE_CLIENT_ID / SECRET         │${NC}"
    echo -e "${YELLOW}  └─────────────────────────────────────────────────────┘${NC}"
    echo ""
    read -r -p "  Continuar amb els valors per defecte? [S/n] " REPLY
    REPLY=${REPLY:-S}
    if [[ ! "$REPLY" =~ ^[Ss]$ ]]; then
        echo "  Edita els fitxers .env i torna a executar ./install.sh"
        exit 0
    fi
fi

# ── Pas 4: Certificats mkcert (HTTPS local) ────────────────────────
info "Pas 4/5: Configurant certificats HTTPS locals (mkcert)..."

if [ ! -f "$INFRA_DIR/certs/localhost.pem" ]; then
    cd "$INFRA_DIR" && bash mkcert-setup.sh
    ok "Certificats mkcert generats"
else
    ok "Certificats mkcert ja existeixen"
fi

# ── Pas 5: Arrencar serveis ────────────────────────────────────────
info "Pas 5/5: Arrencant tots els serveis..."
echo ""

cd "$PROJECT_DIR" && bash start-all.sh
