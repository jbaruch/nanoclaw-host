---
name: promote
description: Promote agent-created skills and rules from NAS staging to tile GitHub repos. Pulls from staging, commits to nanoclaw repo, syncs to tile repo where GHA handles review (85% threshold), lint, and tessl publish. Use when there are new items on staging, or after check-staging shows pending items.
---

# Promote from Staging

Promotes skills and rules from the agent's NAS staging area to tile GitHub repos via `scripts/promote-skill.sh`.

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
echo y | TILE_NAME=nanoclaw-admin ./scripts/promote-skill.sh

# Promote only rules
echo y | TILE_NAME=nanoclaw-trusted ./scripts/promote-skill.sh --rules-only
```

The script:
1. Pulls staged content from NAS into `tiles/{name}/`
2. Commits and pushes to the nanoclaw repo
3. Syncs the tile directory to its GitHub repo (jbaruch/{tile-name})
4. GitHub Actions runs skill review (85% threshold), lint, and tessl publish

## After promoting

1. Check the GitHub Actions run on the tile repo to confirm publish succeeded
2. Tell the agent to run `/verify-tiles` to clean up staging copies

## If GHA fails

Check which skill failed the 85% review threshold. Fix locally:
```bash
tessl skill review --optimize --yes tiles/{tile-name}/skills/{skill-name}/SKILL.md
```
Then commit and push to the tile repo.
