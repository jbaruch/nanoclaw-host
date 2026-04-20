---
name: promote
description: Promote agent-created skills and rules from NAS staging to tile GitHub repos via a full PR lifecycle — opens a PR, summons Copilot, iterates fixups until the review is clean, then merges so GHA publishes. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a tile repo.
---

# Promote from Staging

Runs the tile-repo PR lifecycle on content in the agent's NAS staging area: opens a PR, summons Copilot, iterates fixups, merges. End state is a merged PR on the tile repo; GHA (tessl publish, lint, skill review at 85%) runs on merge. Same review discipline as source-code PRs — no direct pushes to `main`, no merging before Copilot clears.

**Related skills / scripts:** `check-staging` (view pending items before promoting), `ship-code` (same PR discipline for source code). Key scripts: `promote-from-host.sh`, `push-staged-to-branch.sh`, `tile-repo-lib.sh`.

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

## Phase 1 — Open the PR

```bash
# Promote a specific skill to a tile
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh heartbeat

# Promote all skills + rules for a tile
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh all

# Promote only rules
TILE_NAME=nanoclaw-trusted ./scripts/promote-from-host.sh --rules-only
```

The script:
1. Clones the tile repo from GitHub
2. Validates tile placement (blocks admin content from untrusted/core)
3. Checks for cross-tile duplicates
4. Copies skills and rules into the tile repo clone
5. Runs `tessl skill review --optimize --yes` on each promoted skill (shift-left — catches quality issues before PR)
6. Creates a `promote/<timestamp>-<tile>-<hex>` branch, commits, pushes
7. Opens a PR (`--base main`, `--head <branch>`) on the tile repo
8. **Summons Copilot** via the GraphQL `requestReviews` mutation (REST silently drops bot reviewers — see `tile-repo-lib.sh`)

The script prints `PR opened: <url>` and `Branch: <name>` — capture both. Step 5 requires `tessl` on the host machine; if unavailable, the script warns and skips (Copilot + GHA still gate).

## Phase 2 — Wait for review + CI

Don't merge until Copilot has posted a review AND any CI checks are green. Poll:

```bash
gh pr checks <N> --repo jbaruch/<tile>
gh api repos/jbaruch/<tile>/pulls/<N>/reviews \
  --jq '.[] | select(.user.login | contains("opilot")) | {state, body: .body[:120]}'
gh api repos/jbaruch/<tile>/pulls/<N>/comments \
  --jq '.[] | {path, line, body: .body[:200]}'
```

An empty `reviews` array means Copilot hasn't posted yet — wait. Expect a few minutes, sometimes longer under GitHub load.

## Phase 3 — Fix what's fixable

Same discipline as `ship-code`:
- **CI failures**: fix every one. No exceptions.
- **Copilot findings**: apply what's right and reasonable; push back on anything that misreads scope or suggests over-engineering. Reply on **every** thread — accepted or declined — so nothing is left dangling.

**Fix in staging, not in the tile clone.** Otherwise the next re-promote of the same skill regresses the fix. Edit the NAS staging copy, then push the fixup onto the same branch:

```bash
# Host-side (this is the common path when you kicked off the promote from here)
TILE_NAME=<tile> ./scripts/push-staged-to-branch.sh \
  <local-staging-dir> <tile> <branch> "<commit msg>" <skill|all|--rules-only>
```

Inside containers, the equivalent is the `push_staged_to_branch` MCP tool. Both call `scripts/push-staged-to-branch.sh`, which re-summons Copilot after pushing.

Reply on threads:
```bash
# Accepted:
gh api "repos/jbaruch/<tile>/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Fixed in <sha> — <what changed>."
# Declined:
gh api "repos/jbaruch/<tile>/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Declining — <reason: out of scope / intentional / conflicts with X>."
```

Repeat Phase 2 + 3 until CI is green and all Copilot threads are replied to.

## Phase 4 — Merge

Only when CI is green and Copilot review is clean:

```bash
gh pr merge <N> --repo jbaruch/<tile> --merge --delete-branch
```

GHA on `main` then runs the publish workflow. Watch it complete:

```bash
gh run list --repo jbaruch/<tile> --limit 1
```

## After merge

1. Confirm the GHA publish run succeeded (tile version bump visible in the tessl registry).
2. Tell the agent to run `/verify-tiles` to clean up staging copies.
3. For the `nanoclaw-host` tile, run `tessl update` locally to pull the new version; for container tiles, the next `./scripts/deploy.sh` picks them up.

## Non-negotiables

- **Always `--repo`** in every `gh` call. Defaults leak to upstream.
- **Never push directly to `main`** on any tile repo — always PR.
- **Never edit tile repos directly** — all content flows through NAS staging → promote / push-staged pipeline.
- **Never merge before Copilot clears** — same gate as source-code PRs.
