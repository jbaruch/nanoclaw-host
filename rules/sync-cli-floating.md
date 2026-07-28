---
alwaysApply: true
---

# Sync CLI Floating

## Approved exception to `coding-policy: dependency-management`

The `reclaim-tripit-timezones-sync` install in `jbaruch/nanoclaw` `container/Dockerfile` MUST be the bare `jbaruch/reclaim-tripit-timezones-sync` form — never `#v0.x.y`, never `#<sha>`, never a branch ref. This file is the authority-of-record for that reference under the First-Party Co-Shipped Dependency Carve-Out, introduced in `jbaruch/coding-policy` 0.3.129.

## Why this dependency floats

- Same operator writes, reviews, and deploys both repos; a change reaches the agent image only through that operator's own review on the package side
- The package has no release train of its own — `container/Dockerfile` is its only consumer, and `./scripts/deploy.sh` rebuilds against its default branch
- What stands in for the version-bump review is the package repo's own CI on `main`, which runs the full suite on every merge

## Refetch is mandatory, not decoration

- `container/Dockerfile` MUST carry an `ADD <url> <dest>` instruction on the line directly above the `RUN npm install -g`, where `<url>` is `https://api.github.com/repos/jbaruch/reclaim-tripit-timezones-sync/commits/main`
- The `<dest>` argument is required by Dockerfile `ADD` syntax; the current line writes to `/tmp/rtts-head.json` and the `RUN` deletes it
- The commit JSON changes when upstream `main` moves, which invalidates the layer and forces the reinstall
- A cached layer under a bare install resolves to whatever the last rebuild fetched
- `./scripts/deploy.sh --no-cache` is a manual override, never the refetch mechanism

## Verify on every deploy

`scripts/deploy.sh` MUST read the install line out of `container/Dockerfile` and fail the deploy when:

- The reference carries any `#<ref>` specifier
- The `ADD` refetch trigger is absent, sits anywhere other than the line directly above the `RUN`, or names a different repo than the install line
- The install line cannot be located at all — a moved or renamed target fails loudly, never passes vacuously

Run this in `scripts/deploy.sh`, not only in CI: the gate exists to keep a pin off the NAS, and a deploy can run from a working tree CI never saw.

## Scope

- This reference alone. `agent-browser`, `@anthropic-ai/claude-code`, and the `tessl` CLI in `Dockerfile.orchestrator` still pin, and Renovate still watches them
- Renovate's github-tags custom manager for this dependency is removed — a manager matching `#v<tag>` against an unpinned line watches nothing

## Surface sync

When this reference moves or the covered path changes, update in lock-step: this rule's Approved-exception paragraph, the `verify_sync_cli_floating` check in `jbaruch/nanoclaw` `scripts/deploy.sh`, the `ADD` + `RUN` pair and its comment in `container/Dockerfile`, `.github/renovate.json`, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
