#!/usr/bin/env bash
# =============================================================================
# common.sh - Shared shell library for realstate project scripts
#
# Provides color output, print helpers, Docker Compose detection, port
# management, and service lifecycle functions. Sourced by start-all.sh,
# stop-all.sh, status.sh, deploy.sh, etc.
#
# Usage:
#   PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
#   source "$PROJECT_DIR/lib/common.sh"
#   detect_docker_compose
# =============================================================================

# Guard against multiple sourcing
[[ -n "${_COMMON_SH_LOADED:-}" ]] && return; _COMMON_SH_LOADED=1

# ---------------------------------------------------------------------------
# Color variables
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Print helpers (timestamped)
# ---------------------------------------------------------------------------
print_message() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] !${NC} $1"
}

# ---------------------------------------------------------------------------
# Docker Compose detection
#
# Sets the DOCKER_COMPOSE variable. Must be called after PROJECT_DIR is set
# by the sourcing script, since it checks for a local binary first.
# ---------------------------------------------------------------------------
detect_docker_compose() {
    if [ -x "${PROJECT_DIR}/tools/docker-compose" ]; then
        DOCKER_COMPOSE="${PROJECT_DIR}/tools/docker-compose"
    elif docker compose version &>/dev/null; then
        DOCKER_COMPOSE="docker compose"
    elif command -v docker-compose &>/dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        print_error "Docker Compose not found. Install it or place a binary at tools/docker-compose"
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# kill_port - Kill all processes listening on a given TCP port
#
# Tries fuser, then lsof, then ss+/proc. Sends SIGTERM first for graceful
# shutdown, waits 1 second, then SIGKILL any survivors.
#
# Returns 0 if processes were found (and killed), 1 if port was already free.
# ---------------------------------------------------------------------------
kill_port() {
    local port=$1
    local pids=""

    # Method 1: fuser (most reliable across users)
    pids=$(fuser "$port/tcp" 2>/dev/null | tr -s ' ')

    # Method 2: lsof fallback
    if [ -z "$pids" ]; then
        pids=$(lsof -ti:"$port" 2>/dev/null)
    fi

    # Method 3: ss + /proc fallback
    if [ -z "$pids" ]; then
        pids=$(ss -tlnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u)
    fi

    if [ -n "$pids" ]; then
        # SIGTERM first for graceful shutdown
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 1
        # SIGKILL any survivors
        echo "$pids" | xargs kill -9 2>/dev/null || true
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# is_port_free - Check whether a TCP port is available
#
# Returns 0 if the port is free, 1 if something is listening.
# ---------------------------------------------------------------------------
is_port_free() {
    ! ss -tlnp "sport = :$1" 2>/dev/null | grep -q LISTEN
}

# ---------------------------------------------------------------------------
# check_port - Print coloured status of a port (used by status.sh)
# ---------------------------------------------------------------------------
check_port() {
    local port=$1
    local service=$2
    if is_port_free "$port"; then
        echo -e "${RED}○${NC} Port $port ($service): not listening"
    else
        echo -e "${GREEN}●${NC} Port $port ($service): listening"
    fi
}

# ---------------------------------------------------------------------------
# stop_service - Stop a service by PID file, port, and process name patterns
#
# Arguments:
#   $1  name       Display name (e.g. "Frontend")
#   $2  port       TCP port to free (e.g. 3000)
#   $3  pid_file   Path to PID file (may not exist)
#   $@  patterns   Additional process name patterns for pkill fallback
# ---------------------------------------------------------------------------
stop_service() {
    local name=$1       # Display name (e.g. "Frontend")
    local port=$2       # Port to kill (e.g. 3000)
    local pid_file=$3   # PID file path
    shift 3
    local patterns=("$@")  # Process name patterns for pkill fallback

    print_message "Aturant $name..."

    # 1. Via PID file
    if [ -f "$pid_file" ]; then
        kill "$(cat "$pid_file")" 2>/dev/null || true
        rm -f "$pid_file"
    fi

    # 2. Via port
    kill_port "$port" || true

    # 3. Fallback: pkill by name patterns (only if port still in use)
    if ! is_port_free "$port"; then
        for pattern in "${patterns[@]}"; do
            pkill -f "$pattern" 2>/dev/null || true
        done
        sleep 1
        # Force kill if still alive
        if ! is_port_free "$port"; then
            for pattern in "${patterns[@]}"; do
                pkill -9 -f "$pattern" 2>/dev/null || true
            done
            sleep 1
        fi
    fi

    if is_port_free "$port"; then
        print_success "$name aturat (port $port lliure)"
    else
        print_error "No s'ha pogut alliberar el port $port"
    fi
}
