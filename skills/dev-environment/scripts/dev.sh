#!/usr/bin/env bash
set -euo pipefail

# Dev environment manager for laravel-react-template
# Usage: dev.sh <up|down|status> [--skip-migrate]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[dev]${NC} $*"; }
warn()  { echo -e "${YELLOW}[dev]${NC} $*"; }
error() { echo -e "${RED}[dev]${NC} $*" >&2; }

wait_for_mysql() {
    log "Waiting for MySQL to be ready..."
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$BACKEND_DIR/docker-compose.yml" exec -T mysql mysqladmin ping -h localhost -u laravel -psecret --silent 2>/dev/null; then
            log "MySQL is ready."
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    error "MySQL did not become ready after ${max_attempts} attempts."
    return 1
}

check_api() {
    log "Checking API health..."
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:8090/api/v1/config/images > /dev/null 2>&1; then
            log "API is responding at http://localhost:8090"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    warn "API not responding yet — it may still be starting up."
    return 1
}

check_frontend() {
    log "Checking frontend..."
    local max_attempts=15
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            log "Frontend is responding at http://localhost:3000"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    warn "Frontend not responding yet — npm install + dev may still be running."
    return 1
}

cmd_up() {
    local skip_migrate=false
    for arg in "$@"; do
        [ "$arg" = "--skip-migrate" ] && skip_migrate=true
    done

    log "Starting backend services..."
    docker compose -f "$BACKEND_DIR/docker-compose.yml" up -d

    log "Starting frontend services..."
    docker compose -f "$FRONTEND_DIR/docker-compose.yml" up -d

    wait_for_mysql

    if [ "$skip_migrate" = false ]; then
        log "Running migrations..."
        docker compose -f "$BACKEND_DIR/docker-compose.yml" exec -T app php artisan migrate --force
    else
        warn "Skipping migrations (--skip-migrate)."
    fi

    check_api
    check_frontend

    echo ""
    log "=== Dev environment is up ==="
    log "API:        http://localhost:8090/api/v1"
    log "Frontend:   http://localhost:3000"
    log "phpMyAdmin: http://localhost:8091"
    log "Mailpit:    http://localhost:8092"
    log "RabbitMQ:   http://localhost:8093"
}

cmd_down() {
    log "Stopping frontend services..."
    docker compose -f "$FRONTEND_DIR/docker-compose.yml" down

    log "Stopping backend services..."
    docker compose -f "$BACKEND_DIR/docker-compose.yml" down

    log "All services stopped."
}

cmd_status() {
    echo "=== Backend ==="
    docker compose -f "$BACKEND_DIR/docker-compose.yml" ps
    echo ""
    echo "=== Frontend ==="
    docker compose -f "$FRONTEND_DIR/docker-compose.yml" ps
}

case "${1:-}" in
    up)     shift; cmd_up "$@" ;;
    down)   cmd_down ;;
    status) cmd_status ;;
    *)
        echo "Usage: dev.sh <up|down|status> [--skip-migrate]"
        exit 1
        ;;
esac
