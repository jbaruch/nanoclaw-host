---
alwaysApply: true
---

# Tile Content Pipeline

Tile content updates flow through the staging → promote pipeline so GHA handles review, lint, and publish.

## Live-NAS edits are forbidden

Never push content directly to a tile repo for a "quick fix" from the NAS or from the running orchestrator's filesystem. Direct pushes bypass review and risk version conflicts with smart-publish.

## The staging path

1. Push the content to NAS staging: `staging/{tileName}/rules/{name}.md` or `staging/{tileName}/skills/{name}/SKILL.md`
2. Promote with `TILE_NAME={tileName} ./scripts/promote-from-host.sh`

## Feature-branch PRs are OK

Branch + PR work on a tile repo (e.g., `jbaruch/nanoclaw-admin`) from a local clone is fine. That route flows through the tile's PR-time reviewer workflows + post-merge publish-tile pipeline, which is the same review surface the staging→promote path uses.
