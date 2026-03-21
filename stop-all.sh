#!/bin/bash

# Script per aturar tots els serveis del projecte Real Estate
# Autor: Antigravity
# Data: 2026-01-27

# Directori del projecte
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"

source "$PROJECT_DIR/lib/common.sh"
detect_docker_compose

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║         Aturant Real Estate Platform          ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Aturar frontend i backend
stop_service "Frontend" 3000 "$PROJECT_DIR/.frontend.pid" "next dev" "next-server" "next start"
stop_service "Backend" 3002 "$PROJECT_DIR/.backend.pid" "ts-node src/index" "ts-node-esm"

# Aturar serveis Docker
print_message "Aturant serveis Docker..."
(cd "$INFRA_DIR" && $DOCKER_COMPOSE down)
print_success "Serveis Docker aturats"

# Neteja de logs (opcional)
read -p "Vols esborrar els logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[YySs]$ ]]; then
    rm -f "$PROJECT_DIR/backend.log" "$PROJECT_DIR/frontend.log"
    print_success "Logs esborrats"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║        Tots els serveis aturats!               ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
