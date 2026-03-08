#!/bin/bash

# Script per aturar tots els serveis del projecte Real Estate
# Autor: Antigravity
# Data: 2026-01-27

# Colors per a la sortida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directori del projecte
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"

# Detect docker-compose binary
if [ -f "$PROJECT_DIR/tools/docker-compose" ]; then
    DOCKER_COMPOSE="$PROJECT_DIR/tools/docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Funció per imprimir missatges
print_message() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║         Aturant Real Estate Platform          ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Kill all processes listening on a given port
kill_port() {
    local port=$1
    local pids
    pids=$(lsof -ti:"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        return 0
    fi
    return 1
}

# Aturar frontend (Next.js - port 3000 + tots els processos fills)
print_message "Aturant frontend..."
FRONTEND_STOPPED=false

# 1. Intentar via PID file (procés pare npm)
if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/.frontend.pid")
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.frontend.pid"
fi

# 2. Matar per port 3000 (inclou tots els workers de Node.js que hi escoltin)
if kill_port 3000; then
    FRONTEND_STOPPED=true
fi

# 3. Matar qualsevol procés next o next-server que quedi
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true

sleep 1
if ! lsof -ti:3000 >/dev/null 2>&1; then
    print_success "Frontend aturat (port 3000 lliure)"
else
    print_error "No s'ha pogut alliberar el port 3000"
fi

# Aturar backend (Node.js - port 3002 + tots els processos fills)
print_message "Aturant backend..."

# 1. Intentar via PID file
if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/.backend.pid")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$PROJECT_DIR/.backend.pid"
fi

# 2. Matar per port 3002
if kill_port 3002; then
    true
fi

# 3. Matar qualsevol procés ts-node/node del backend que quedi
pkill -9 -f "ts-node src/index" 2>/dev/null || true
pkill -9 -f "ts-node-esm" 2>/dev/null || true

sleep 1
if ! lsof -ti:3002 >/dev/null 2>&1; then
    print_success "Backend aturat (port 3002 lliure)"
else
    print_error "No s'ha pogut alliberar el port 3002"
fi

# Aturar serveis Docker
print_message "Aturant serveis Docker..."
cd "$INFRA_DIR"
$DOCKER_COMPOSE down
print_success "Serveis Docker aturats"

# Neteja de logs (opcional)
read -p "Vols esborrar els logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[YySs]$ ]]; then
    rm -f "$PROJECT_DIR/backend.log"
    rm -f "$PROJECT_DIR/frontend.log"
    print_success "Logs esborrats"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║        Tots els serveis aturats!               ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
