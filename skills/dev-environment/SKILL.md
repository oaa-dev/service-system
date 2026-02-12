---
name: dev-environment
description: Start, stop, and check the status of the full development environment (backend + frontend Docker containers). Use when the user asks to start/run/spin up the project, run docker, launch the dev environment, stop/shut down containers, or check if services are running. Triggers on phrases like "start the project", "docker up", "spin up containers", "run the dev environment", "stop docker", "shut down", "are services running", "check status".
---

# Dev Environment

Manage both backend and frontend Docker Compose stacks with a single script.

## Script

`scripts/dev.sh` handles all operations. Run from any directory — it resolves paths relative to the project root.

```bash
# Start everything (backend + frontend + migrations + health checks)
bash <skill-path>/scripts/dev.sh up

# Start without running migrations
bash <skill-path>/scripts/dev.sh up --skip-migrate

# Stop everything
bash <skill-path>/scripts/dev.sh down

# Check container status
bash <skill-path>/scripts/dev.sh status
```

## What `up` Does

1. Starts backend containers (`backend/docker-compose.yml`): app, nginx, MySQL, Redis, RabbitMQ, Mailpit, phpMyAdmin, Reverb
2. Starts frontend container (`frontend/docker-compose.yml`): Next.js dev server
3. Waits for MySQL to accept connections (up to 60s)
4. Runs `php artisan migrate --force` (skip with `--skip-migrate`)
5. Verifies API responds at `http://localhost:8090`
6. Verifies frontend responds at `http://localhost:3000`
7. Prints summary with all service URLs

## Service URLs

| Service | URL |
|---------|-----|
| API | http://localhost:8090/api/v1 |
| Frontend | http://localhost:3000 |
| phpMyAdmin | http://localhost:8091 |
| Mailpit | http://localhost:8092 |
| RabbitMQ | http://localhost:8093 |
