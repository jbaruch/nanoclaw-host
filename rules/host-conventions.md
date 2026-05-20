---
alwaysApply: true
---

# Host Agent Conventions

Deployment mechanics for the NanoClaw host agent (Claude Code on Mac). Other host-tier rules cover collaboration, ownership, and infrastructure patterns — see the host tile's `README.md` rules table.

## Always deploy with deploy.sh

Never run `docker compose up -d --build` directly. Always use `./scripts/deploy.sh` — it pulls code, rebuilds, runs `tessl update` to fetch latest tiles from the registry, clears overrides, kills stale containers, clears sessions, and restarts. Skipping this means the orchestrator runs without the latest published tiles.

## Registry is the delivery artifact

Tessl registry plugins are what gets delivered to containers. Git is the source, not the delivery mechanism. Never skip publishing — always run the full promote pipeline.

## Scripts use common.sh

All scripts in `scripts/` source `scripts/common.sh` for shared config (`NAS_HOST`, `NAS_PROJECT_DIR`, `nas()` helper). No hardcoded IPs or paths.
