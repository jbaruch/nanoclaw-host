---
name: promote
description: Promote agent-created skills and rules from NAS staging to tile GitHub repos. GHA handles review (85%), lint, and tessl publish. Use when there are items on staging, or after check-staging shows pending items.
---

# Promote from Staging

Promotes skills and rules from the agent's NAS staging area directly to tile GitHub repos via `scripts/promote-from-host.sh`.

## Before promoting

Run `./scripts/check-staging.sh` to see what's pending. Review each item before promoting.

## Determine the target tile

Each item belongs to exactly one tile:

| Content | Target tile | GitHub repo |
|---------|------------|-------------|
| Admin/operational skills | `nanoclaw-admin` | jbaruch/nanoclaw-admin (private) |
| Trusted shared operational | `nanoclaw-trusted` | jbaruch/nanoclaw-trusted |
| Security rules for untrusted | `nanoclaw-untrusted` | jbaruch/nanoclaw-untrusted |
| Shared behavior (all containers) | `nanoclaw-core` | jbaruch/nanoclaw-core |
| Host agent conventions | `nanoclaw-host` | jbaruch/nanoclaw-host |

## Run the promote script

```bash
# Promote all skills + rules for a tile
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh

# Promote a specific skill
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh heartbeat

# Promote only rules
TILE_NAME=nanoclaw-trusted ./scripts/promote-from-host.sh --rules-only
```

The script pulls staging from NAS, pushes directly to the tile's GitHub repo. GHA runs skill review (85% threshold), lint, and tessl publish automatically.

## After promoting

Check the GitHub Actions run on the tile repo to confirm publish succeeded. Tell AyeAye to run `/verify-tiles` to clean up staging.

## If GHA review fails

Fix locally and push to the tile repo:
```bash
cd /tmp/tile-nanoclaw-admin
tessl skill review --optimize --yes skills/{skill-name}/SKILL.md
git add -A && git commit -m "fix: optimize skill" && git push origin main
```
