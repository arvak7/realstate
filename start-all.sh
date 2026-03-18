#!/bin/bash

# Script per arrencar tots els serveis del projecte Real Estate
# Autor: Antigravity
# Data: 2026-01-27

set -e  # Sortir si hi ha errors

# Colors per a la sortida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directori del projecte
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$PROJECT_DIR/infra"
BACKEND_DIR="$PROJECT_DIR/backend"
WEB_DIR="$PROJECT_DIR/web"

# Load environment configuration from infra/.env
if [ -f "$INFRA_DIR/.env" ]; then
    set -a
    source "$INFRA_DIR/.env"
    set +a
else
    print_warning() { echo -e "\033[1;33m[$(date +'%H:%M:%S')] ⚠\033[0m $1"; }
    print_warning "No s'ha trobat infra/.env. Copia infra/.env.example a infra/.env i configura'l."
    print_warning "Usant valors per defecte (DEV/localhost)"
fi

# Defaults
DOMAIN="${DOMAIN:-localhost}"
APP_ENV="${APP_ENV:-DEV}"
SSL_MODE="${SSL_MODE:-mkcert}"

# Ensure we use NVM node if available (fixes prisma compilation errors with old system node)
if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST_NODE=$(ls -td "$HOME/.nvm/versions/node"/v* | head -1)
    if [ -d "$LATEST_NODE/bin" ]; then
        export PATH="$LATEST_NODE/bin:$PATH"
        echo "Using Node.js from NVM: $LATEST_NODE"
    fi
fi

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

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"
}

# Funció per esperar que un servei estigui saludable
wait_for_service() {
    local service_name=$1
    local max_attempts=60
    local attempt=0
    
    print_message "Esperant que $service_name estigui saludable..."
    
    while [ $attempt -lt $max_attempts ]; do
        if docker inspect --format='{{.State.Health.Status}}' "realstate-$service_name" 2>/dev/null | grep -q "healthy"; then
            print_success "$service_name està saludable"
            return 0
        fi
        
        # Alguns serveis no tenen healthcheck, comprovem si estan running
        if docker inspect --format='{{.State.Status}}' "realstate-$service_name" 2>/dev/null | grep -q "running"; then
            # Si no té healthcheck però està running, esperem uns segons més
            if [ $attempt -gt 10 ]; then
                print_success "$service_name està en execució"
                return 0
            fi
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    print_warning "$service_name no està saludable després de $max_attempts intents, però continuem..."
    return 0
}

# Funció per comprovar si un port està en ús
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Banner
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}║        Real Estate Platform Launcher          ║${NC}"
echo -e "${BLUE}║                                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Pas 1: Aturar serveis anteriors si existeixen
print_message "Pas 1/7: Netejant serveis anteriors..."
cd "$INFRA_DIR"

# Aturar processos de Node.js anteriors
if pgrep -f "ts-node src/index.ts" > /dev/null; then
    print_warning "Aturant backend anterior..."
    pkill -f "ts-node src/index.ts" || true
fi

if pgrep -f "next dev" > /dev/null; then
    print_warning "Aturant frontend anterior..."
    pkill -f "next dev" || true
fi

print_success "Neteja completada"

# Pas 1.5: Generate Caddyfile from template
if ! command -v envsubst >/dev/null 2>&1; then
    print_warning "envsubst no trobat. Instal·la gettext-base: apt install gettext-base"
    print_warning "Usant Caddyfile existent sense substituir variables."
else
    if [ "$SSL_MODE" = "letsencrypt" ]; then
        CADDY_TEMPLATE="$INFRA_DIR/caddy/Caddyfile.prod"
    else
        CADDY_TEMPLATE="$INFRA_DIR/caddy/Caddyfile.dev"
    fi

    if [ -f "$CADDY_TEMPLATE" ]; then
        envsubst < "$CADDY_TEMPLATE" > "$INFRA_DIR/caddy/Caddyfile"
        print_success "Caddyfile generat (${SSL_MODE}, domini: ${DOMAIN})"
    else
        print_warning "Template $CADDY_TEMPLATE no trobat. Usant Caddyfile existent."
    fi
fi

# Pas 2: Arrencar serveis Docker
print_message "Pas 2/7: Arrencant serveis Docker..."
cd "$INFRA_DIR"

$DOCKER_COMPOSE up -d

print_success "Serveis Docker arrencats"

# Pas 3: Esperar que els serveis estiguin saludables
print_message "Pas 3/7: Esperant que els serveis estiguin saludables..."

wait_for_service "postgres"
wait_for_service "redis"
wait_for_service "elasticsearch"
wait_for_service "minio"
wait_for_service "zitadel"
wait_for_service "caddy"

print_success "Tots els serveis Docker estan saludables"

# Pas 3.5: Configure Zitadel (one-time only)
if [ -f "$INFRA_DIR/.zitadel-configured" ]; then
    print_success "Zitadel ja configurat (saltant setup)"
elif [ -f "$INFRA_DIR/setup-zitadel.sh" ]; then
    print_message "Pas 3.5/7: Configurant Zitadel..."
    bash "$INFRA_DIR/setup-zitadel.sh" || print_warning "Zitadel setup failed (non-blocking). Manual configuration may be needed."
    print_success "Configuració de Zitadel completada"
    # Restart login container to pick up newly created PAT
    print_message "Reiniciant Zitadel Login V2..."
    cd "$INFRA_DIR"
    $DOCKER_COMPOSE restart zitadel-login 2>/dev/null || true
    print_success "Zitadel Login V2 reiniciat"
else
    print_warning "setup-zitadel.sh not found, skipping Zitadel configuration"
fi

# Pas 4: Aplicar migracions de Prisma
print_message "Pas 4/7: Aplicant migracions de Prisma..."
cd "$BACKEND_DIR"

# Comprovar si existeix .env
if [ ! -f .env ]; then
    print_error "No s'ha trobat backend/.env. Copia backend/.env.example i configura'l."
    print_error "Veure: cp backend/.env.example backend/.env"
    exit 1
fi

# Aplicar migracions
npm run prisma:migrate -- --name init || print_warning "Les migracions ja poden estar aplicades"

print_success "Migracions de Prisma aplicades"

# Pas 4.5: Seed de la base de dades (primera vegada)
if [ ! -f "$PROJECT_DIR/.db-seeded" ]; then
    print_message "Pas 4.5/7: Seeding de la base de dades..."
    npm run seed
    touch "$PROJECT_DIR/.db-seeded"
    print_success "Base de dades inicialitzada amb dades de catàleg"
else
    print_success "Base de dades ja inicialitzada (saltant seed)"
fi

# Pas 5: Arrencar el backend
print_message "Pas 5/7: Arrencant el backend..."
cd "$BACKEND_DIR"

# Comprovar si el port 3002 està lliure
if check_port 3002; then
    print_error "El port 3002 ja està en ús. Aturant el procés..."
    lsof -ti:3002 | xargs kill -9 || true
    sleep 2
fi

# Arrencar backend en background
nohup npm run dev > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Esperar que el backend estigui llest
sleep 5

if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend arrencat (PID: $BACKEND_PID)"
else
    print_error "El backend no s'ha pogut arrencar. Revisa backend.log"
    exit 1
fi

# Pas 6: Arrencar el frontend
print_message "Pas 6/7: Arrencant el frontend..."
cd "$WEB_DIR"

# Comprovar si existeix .env.local
if [ ! -f .env.local ]; then
    print_error "No s'ha trobat web/.env.local. Copia web/.env.example i configura'l."
    print_error "Veure: cp web/.env.example web/.env.local"
    exit 1
fi

# Comprovar si el port 3000 està lliure
if check_port 3000; then
    print_error "El port 3000 ja està en ús. Aturant el procés..."
    lsof -ti:3000 | xargs kill -9 || true
    sleep 2
fi

# Netejar lock file si existeix
rm -f .next/dev/lock

# Arrencar frontend en background (forçant port 3000)
nohup npm run dev -- -p 3000 > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Esperar que el frontend estigui llest
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend arrencat (PID: $FRONTEND_PID)"
else
    print_error "El frontend no s'ha pogut arrencar. Revisa frontend.log"
    exit 1
fi

# Resum final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║          Tots els serveis arrencats!           ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Serveis disponibles (${APP_ENV}):${NC}"
echo -e "  ${GREEN}•${NC} Frontend:       https://${DOMAIN}"
echo -e "  ${GREEN}•${NC} Backend API:    https://${DOMAIN}/api"
echo -e "  ${GREEN}•${NC} Login:          https://${DOMAIN}/ui/v2/login"
echo -e "  ${GREEN}•${NC} MinIO Console:  https://${DOMAIN}:9001"
echo -e "  ${GREEN}•${NC} Elasticsearch:  http://localhost:9200"
echo -e "  ${GREEN}•${NC} Redis:          localhost:6379"
echo -e "  ${GREEN}•${NC} PostgreSQL:     localhost:5432"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  ${GREEN}•${NC} Backend:  tail -f $PROJECT_DIR/backend.log"
echo -e "  ${GREEN}•${NC} Frontend: tail -f $PROJECT_DIR/frontend.log"
echo -e "  ${GREEN}•${NC} Docker:   cd $INFRA_DIR && $DOCKER_COMPOSE logs -f"
echo ""
echo -e "${YELLOW}Per aturar tots els serveis, executa:${NC}"
echo -e "  ./stop-all.sh"
echo ""

# Guardar PIDs per poder aturar-los després
echo "$BACKEND_PID" > "$PROJECT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$PROJECT_DIR/.frontend.pid"

print_success "Sistema completament operatiu!"
