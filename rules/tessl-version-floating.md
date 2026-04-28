---
alwaysApply: true
---

# Tessl Version Floating

## Approved exception to `coding-policy: dependency-management`

`coding-policy: dependency-management` says "pin versions or use a lock file" for reproducibility. **The owner has approved a deliberate exception for `tessl-workspace/tessl.json`**: every `dependencies.<tile>.version` MUST be `"latest"`, never a literal `0.1.x` pin. This is documented here as the authority-of-record.

## Why the exception exists

`tessl update` rewrites the manifest in-place at three independent points (`scripts/deploy.sh`, the orchestrator's 15-min catch-up loop in `src/index.ts`, the `tessl_update` MCP tool in `src/ipc.ts`). With literal pins, every successful update produces a working-tree diff that nobody commits — `git status` accumulates a stale-pin diff, `git pull` rolls the orchestrator backward, and the fleet quietly runs whichever tile versions were last hand-committed instead of whatever the registry has now. Verified 2026-04-27: the host repo's working tree was 22 days behind `main` on every tile despite the orchestrator running the latest pins.

`"latest"` resolves at install / update time and DOES NOT rewrite the manifest, so `git status` stays clean and a `git pull` is safe. Reproducibility is sacrificed by design — the orchestrator is a single deployment we control end-to-end, not a library distributed to third parties; for this one manifest the operational cost of pin drift dominates the value of pin-level reproducibility. `dependency-management` still applies everywhere else (`package.json`, `requirements-dev.txt`, etc.).

## Verify on every deploy

`scripts/deploy.sh` MUST include a step that reads `tessl-workspace/tessl.json` and fails the deploy if any `dependencies.*.version` value is anything other than `"latest"`. The check exists to catch:

- A `tessl install <tile>` invocation that wrote a pin (the default behaviour).
- A merge from a fork where the pinned form leaked back in.
- An operator hand-edit "for one quick test" that never got reverted.

The check belongs in `deploy.sh` (not just CI) because the failure mode it prevents is silent runtime drift, and the deploy is the gate every change must pass through to actually take effect.

## When `tessl install <tile>` writes a pin, fix it before commit

Verified 2026-04-27 against the live tessl CLI: `tessl install jbaruch/<tile>` writes a literal pin into the manifest (no flag for floating). Fix: edit the just-installed entry to `"version": "latest"` BEFORE committing. The deploy verification will catch any miss.
