---
alwaysApply: true
---

# Tessl Version Floating

## Approved exception to `coding-policy: dependency-management`

`coding-policy: dependency-management` says "pin versions or use a lock file" for reproducibility. **The owner has approved a deliberate exception for every `tessl.json` in NanoClaw**: each manifest MUST declare `"mode": "managed"` AND every `dependencies.<tile>.version` MUST be `"latest"` — never `"vendored"` mode, never a literal `0.1.x` pin. This applies to the orchestrator-workspace manifest (`tessl-workspace/tessl.json`) AND the project-root manifest (`tessl.json`, consumed by `tessl install` to populate the gitignored `.tessl/tiles/` for `@.tessl/RULES.md` resolution at agent runtime). This file is the authority-of-record.

## Why the exception exists

`tessl update` rewrites manifests in-place at three independent points (`scripts/deploy.sh`, the orchestrator's 15-min catch-up loop in `src/index.ts`, the `tessl_update` MCP tool in `src/ipc.ts`), and `.tessl/tiles/<workspace>/<tile>/` is `.gitignore`d (regenerated on every install). With literal pins, every successful update produces a working-tree diff that nobody commits — `git status` accumulates stale-pin drift, `git pull` rolls the orchestrator backward, and the fleet quietly runs whichever tile versions were last hand-committed instead of whatever the registry has now. With `"mode": "vendored"` declared on a manifest whose tile content is gitignored, the manifest claims a contract the repo isn't keeping (vendored content should be committed); the runtime treats this as managed-with-broken-lifecycle. Verified 2026-04-27: the orchestrator workspace's working tree was 22 days behind `main` on every tile despite the orchestrator running the latest pins. Verified 2026-05-03: the project-root `tessl.json` had been silently rewriting between `0.1.17`/`0.2.3` (HEAD) and `0.1.27`/`0.3.12` (working tree on the deployed NAS) without anyone committing the drift, on top of declaring a `vendored` mode the gitignored tile content contradicted.

`"mode": "managed"` + `"version": "latest"` resolves both invariants at install / update time and DOES NOT rewrite the manifest, so `git status` stays clean and a `git pull` is safe. Reproducibility is sacrificed by design — the orchestrator is a single deployment we control end-to-end, not a library distributed to third parties; for these manifests the operational cost of mode/pin drift dominates the value of pin-level reproducibility. `coding-policy: dependency-management` still applies everywhere else (`package.json`, `requirements-dev.txt`, etc.).

## Verify on every deploy

`scripts/deploy.sh` MUST include a step that walks every `tessl.json` in the repo (excluding the `.tessl/`, `node_modules/`, `groups/`, `data/`, `dist/` generated subtrees) and fails the deploy if any manifest fails one of:

- `mode != "managed"` (catches a stale `"vendored"` declaration or a missing field).
- Any `dependencies.<tile>.version` not equal to the literal string `"latest"`.
- `OSError` / `JSONDecodeError` reading the file (catches a partial write).

The check exists to catch:

- A `tessl install <tile>` invocation that wrote a pin (the default behavior).
- A `tessl init` shape from an older CLI that wrote `"mode": "vendored"`.
- A merge from a fork where the pinned or vendored form leaked back in.
- An operator hand-edit "for one quick test" that never got reverted.

The check belongs in `deploy.sh` (not just CI) because the failure mode it prevents is silent runtime drift, and the deploy is the gate every change must pass through to actually take effect.

## When `tessl install <tile>` writes a pin, fix it before commit

Verified 2026-04-27 against the live tessl CLI: `tessl install jbaruch/<tile>` writes a literal pin into the manifest (no flag for floating). Fix: edit the just-installed entry to `"version": "latest"` BEFORE committing. If the same install call left `"mode": "vendored"` on the surrounding manifest (older CLI shapes), flip it to `"mode": "managed"` in the same edit. The deploy verification will catch any miss.
