---
alwaysApply: true
---

# Sync CLI Floating

## Approved exception to `coding-policy: dependency-management`

The `reclaim-tripit-timezones-sync` install in `jbaruch/nanoclaw` `container/Dockerfile` MUST be the bare `jbaruch/reclaim-tripit-timezones-sync` form — never `#v0.x.y`, never `#<sha>`, never a branch ref. This file is the authority-of-record for that reference under the First-Party Co-Shipped Dependency Carve-Out.

## Why this dependency floats

- Same operator writes, reviews, and deploys both repos; a change reaches the agent image only through that operator's own review on the package side
- The package has no release train of its own — `container/Dockerfile` is its only consumer, and `./scripts/deploy.sh` rebuilds against its default branch
- The pin's failure mode is silent: the package gained OneCLI gateway support on 2026-07-10 with no tag cut, so Renovate's github-tags manager had nothing to propose and the agent image kept a build that created zero OOO blocks for 19 days
- What stands in for the version-bump review is the package repo's own CI on `main`, which runs the full suite on every merge

## Refetch is mandatory, not decoration

- `container/Dockerfile` MUST carry the `ADD https://api.github.com/repos/jbaruch/reclaim-tripit-timezones-sync/commits/main` line directly above the `RUN npm install -g`
- The commit JSON changes when upstream `main` moves, which invalidates the layer and forces the reinstall
- Without it BuildKit serves the cached layer forever and the floating reference resolves to whatever the last rebuild happened to fetch — a pin with no version anyone can read, which is the failure this carve-out exists to prevent
- `./scripts/deploy.sh --no-cache` is a manual override, never the refetch mechanism

## Verify on every deploy

`scripts/deploy.sh` MUST read the install line out of `container/Dockerfile` and fail the deploy when:

- The reference carries any `#<ref>` specifier
- The `ADD` refetch trigger is absent, or points at a different repo than the install line
- The install line cannot be located at all — a moved or renamed target fails loudly, never passes vacuously

Run this in `scripts/deploy.sh`, not only in CI: the gate exists to keep a pin off the NAS, and a deploy can run from a working tree CI never saw.

## Scope

- This reference alone. `agent-browser`, `@anthropic-ai/claude-code`, and the `tessl` CLI in `Dockerfile.orchestrator` still pin, and Renovate still watches them
- Renovate's github-tags custom manager for this dependency is removed — a manager matching `#v<tag>` against an unpinned line watches nothing

## Surface sync

When this reference moves or the covered path changes, update in lock-step: this rule's Approved-exception paragraph, the `verify_sync_cli_floating` check in `jbaruch/nanoclaw` `scripts/deploy.sh`, the `ADD` + `RUN` pair and its comment in `container/Dockerfile`, `.github/renovate.json`, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
