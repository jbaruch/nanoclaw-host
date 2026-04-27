---
alwaysApply: true
---

# Tessl Version Pin Drift

## Pins are correct — surfacing the bump is the bug

Per `coding-policy: dependency-management`, dependency manifests should pin versions or commit a lock file. `tessl-workspace/tessl.json` follows the pin form. Don't switch to `"latest"` or any floating range — `tessl install` resolves at runtime against whatever's currently on the registry, and `.tessl/tiles/<tile>/tile.json` (where the resolved version would otherwise land) is gitignored. Floating manifest + ignored lock = no lock at all, which the dependency-management rule disallows.

The actual bug is downstream of the pins: **`tessl update` rewrites the manifest in-place but no automation surfaces the resulting bump back to git.**

## How the drift happens

The orchestrator's `/app/tessl-workspace/tessl.json` is bind-mounted from the host repo's `tessl-workspace/tessl.json`. Three flows trigger `tessl update`: `scripts/deploy.sh`, the orchestrator's 15-minute periodic catch-up loop in `src/index.ts`, and the `tessl_update` MCP tool. Each writes the new pins back to the bind-mounted file, but no flow commits the result. A subsequent `git pull` (or fresh clone + container rebuild) overwrites the in-place bumps with whatever pins were last hand-committed — silently rolling tile content backward across the fleet.

Verified on 2026-04-27: NAS working tree was 22 days behind `main` on every tile.

## Fix: surface the bump via a PR, never a direct push

Each `tessl update` caller MUST, on success, check whether `tessl-workspace/tessl.json` has a working-tree diff against `HEAD` and — if so — open a `chore/tessl-pin-bump-<epoch-secs>-<rand>` PR via `gh pr create --repo jbaruch/nanoclaw --base main` against the host repo. The `--repo` flag is mandatory per `nanoclaw-host: repo-chain` so the bump can't accidentally land on a fork or upstream. Reasons for the PR shape:

- `coding-policy: ci-safety` forbids direct pushes to `main` and `[skip ci]` commits. The PR flow keeps both branch protections and CI gates intact.
- `coding-policy: ci-safety` requires lowercase-hyphenated `<description>` in `<type>/<description>` branch names. Use epoch-seconds (numeric) plus a 4-hex random suffix; ISO 8601 has uppercase `T`/`Z`.
- The diff comparison is against `HEAD`, not the index — `git add` between the update and the check would otherwise mask the diff.

The implementation lives in operator scripts (one per caller) referenced from `host-conventions`; this rule names the contract. Bump PRs are mechanical and auto-mergeable once CI is green; the cost is one fast review cycle, which is the right price for keeping branch protections intact.

Human-driven bumps (operator runs `tessl update` locally after deploy) follow the same rule — the bump goes through a PR, never a direct commit to `main`.
