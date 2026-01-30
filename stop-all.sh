#!/bin/bash

# Script per aturar tots els serveis del projecte Real Estate
# Autor: Antigravity
# Data: 2026-01-27

set -e

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

# Aturar frontend
print_message "Aturant frontend..."
if [ -f "$PROJECT_DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$PROJECT_DIR/.frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        print_success "Frontend aturat (PID: $FRONTEND_PID)"
    else
        print_message "Frontend ja estava aturat"
    fi
    rm "$PROJECT_DIR/.frontend.pid"
else
    # Intentar aturar per nom de procés
    if pgrep -f "next dev" > /dev/null; then
        pkill -f "next dev"
        print_success "Frontend aturat"
    else
        print_message "Frontend ja estava aturat"
    fi
fi

# Aturar backend
print_message "Aturant backend..."
if [ -f "$PROJECT_DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/.backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        print_success "Backend aturat (PID: $BACKEND_PID)"
    else
        print_message "Backend ja estava aturat"
    fi
    rm "$PROJECT_DIR/.backend.pid"
else
    # Intentar aturar per nom de procés
    if pgrep -f "ts-node src/index.ts" > /dev/null; then
        pkill -f "ts-node src/index.ts"
        print_success "Backend aturat"
    else
        print_message "Backend ja estava aturat"
    fi
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
