---
alwaysApply: true
---

# Tessl Version Floating

## Approved exception to `coding-policy: dependency-management`

Every `tessl.json` in NanoClaw MUST declare `"mode": "managed"` AND every `dependencies.<tile>.version` MUST be `"latest"` — never `"vendored"` mode, never a literal `0.1.x` pin. Covers the orchestrator-workspace manifest (`tessl-workspace/tessl.json`) AND the project-root manifest (`tessl.json`). This file is the authority-of-record.

## Verify on every deploy

`scripts/deploy.sh` MUST read each manifest in the carve-out set (`tessl-workspace/tessl.json`, project-root `tessl.json`; future additions append here in lock-step) and fail the deploy if any manifest fails one of:

- `mode != "managed"` (catches a stale `"vendored"` declaration or a missing field).
- Any `dependencies.<tile>.version` not equal to the literal string `"latest"`.
- `OSError` / `JSONDecodeError` reading the file (catches a partial write).

The check catches:

- A `tessl install <tile>` invocation that wrote a pin (the default behavior).
- A `tessl init` shape from an older CLI that wrote `"mode": "vendored"`.
- A merge from a fork where the pinned or vendored form leaked back in.
- An operator hand-edit "for one quick test" that never got reverted.

Runs in `deploy.sh`, not just CI — silent runtime drift only surfaces at deploy.

## When `tessl install <tile>` writes a pin, fix it before commit

`tessl install jbaruch/<tile>` writes a literal pin into the manifest (no flag for floating). Edit the just-installed entry to `"version": "latest"` BEFORE committing. If the same install call left `"mode": "vendored"` on the surrounding manifest, flip it to `"mode": "managed"` in the same edit.
