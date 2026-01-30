#!/bin/bash

# Script per comprovar l'estat dels serveis del projecte Real Estate
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

# Detect docker-compose binary
if [ -f "$PROJECT_DIR/tools/docker-compose" ]; then
    DOCKER_COMPOSE="$PROJECT_DIR/tools/docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Funció per comprovar si un servei Docker està running
check_docker_service() {
    local service_name=$1
    if docker ps --format '{{.Names}}' | grep -q "realstate-$service_name"; then
        local status=$(docker inspect --format='{{.State.Status}}' "realstate-$service_name" 2>/dev/null)
        local health=$(docker inspect --format='{{.State.Health.Status}}' "realstate-$service_name" 2>/dev/null)
        
        if [ "$health" == "healthy" ]; then
            echo -e "${GREEN}●${NC} $service_name: running (healthy)"
        elif [ "$health" == "unhealthy" ]; then
            echo -e "${RED}●${NC} $service_name: running (unhealthy)"
        elif [ "$status" == "running" ]; then
            echo -e "${YELLOW}●${NC} $service_name: running (no healthcheck)"
        else
            echo -e "${RED}●${NC} $service_name: $status"
        fi
    else
        echo -e "${RED}○${NC} $service_name: not running"
    fi
}

# Funció per comprovar si un procés està running
check_process() {
    local process_name=$1
    local display_name=$2
    local pid_file=$3
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${GREEN}●${NC} $display_name: running (PID: $pid)"
            return
        fi
    fi
    
    if pgrep -f "$process_name" > /dev/null; then
        local pid=$(pgrep -f "$process_name" | head -1)
        echo -e "${YELLOW}●${NC} $display_name: running (PID: $pid, no pid file)"
    else
        echo -e "${RED}○${NC} $display_name: not running"
    fi
}

# Funció per comprovar si un port està en ús
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}●${NC} Port $port ($service): listening"
    else
        echo -e "${RED}○${NC} Port $port ($service): not listening"
    fi
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║      Real Estate Platform - Status Check      ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Comprovar serveis Docker
echo -e "${BLUE}Docker Services:${NC}"
check_docker_service "postgres"
check_docker_service "redis"
check_docker_service "elasticsearch"
check_docker_service "minio"
check_docker_service "zitadel"
check_docker_service "caddy"
echo ""

# Comprovar aplicacions
echo -e "${BLUE}Applications:${NC}"
check_process "ts-node src/index.ts" "Backend" "$PROJECT_DIR/.backend.pid"
check_process "next dev" "Frontend" "$PROJECT_DIR/.frontend.pid"
echo ""

# Comprovar ports
echo -e "${BLUE}Network Ports:${NC}"
check_port 3000 "Frontend"
check_port 3001 "Backend API"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
check_port 9200 "Elasticsearch"
check_port 9000 "MinIO API"
check_port 9001 "MinIO Console"
check_port 443 "HTTPS (Caddy)"
check_port 80 "HTTP (Caddy)"
echo ""

# Informació de logs
echo -e "${BLUE}Log Files:${NC}"
if [ -f "$PROJECT_DIR/backend.log" ]; then
    local backend_size=$(du -h "$PROJECT_DIR/backend.log" | cut -f1)
    echo -e "${GREEN}●${NC} backend.log: $backend_size"
else
    echo -e "${RED}○${NC} backend.log: not found"
fi

if [ -f "$PROJECT_DIR/frontend.log" ]; then
    local frontend_size=$(du -h "$PROJECT_DIR/frontend.log" | cut -f1)
    echo -e "${GREEN}●${NC} frontend.log: $frontend_size"
else
    echo -e "${RED}○${NC} frontend.log: not found"
fi
echo ""

# Comandes útils
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  ${GREEN}•${NC} View backend logs:   tail -f $PROJECT_DIR/backend.log"
echo -e "  ${GREEN}•${NC} View frontend logs:  tail -f $PROJECT_DIR/frontend.log"
echo -e "  ${GREEN}•${NC} View Docker logs:    cd infra && $DOCKER_COMPOSE logs -f"
echo -e "  ${GREEN}•${NC} Restart all:         ./start-all.sh"
echo -e "  ${GREEN}•${NC} Stop all:            ./stop-all.sh"
echo ""
