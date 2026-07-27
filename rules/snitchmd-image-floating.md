---
alwaysApply: true
---

# Snitchmd Image Floating

## Approved exception to `coding-policy: dependency-management`

The `fetch_markdown` sidecar image default in `jbaruch/nanoclaw` `src/ipc-handlers/ops-fetch.ts` MUST be the floating tag `syabro/snitchmd:latest` — never a literal `0.2.x` tag, never a `sha256:` digest. This file is the authority-of-record.

## Why this dependency floats

- snitchmd is a renderer and content extractor, not an API contract — `fetch_markdown` consumes its markdown output, whose shape is stable across point releases
- Its value is adversarial freshness: each release carries updated CloakBrowser fingerprints, and a pinned image degrades toward blocked fetches as anti-bot detection advances
- A pin's renewal cadence competes with an adversary's release cadence; the operator learns the pin is stale by `fetch_markdown` silently failing on the sites that matter
- `SNITCHMD_IMAGE` is the operator's escape hatch: an install needing a reproducible build sets a tag or digest in its own environment, which the deploy gate below does not read

## Verify on every deploy

`scripts/deploy.sh` MUST read the image default out of `src/ipc-handlers/ops-fetch.ts` and fail the deploy when it is anything other than the literal `syabro/snitchmd:latest`.

The check catches:

- A hand-edit "just to reproduce that one bug" that never got reverted
- A merge from a fork carrying a pinned default
- A well-meaning dependency-scanner PR rewriting the default to a digest
- A rename or refactor that moves the constant somewhere the gate can no longer see it — an unreadable source file fails the deploy rather than passing vacuously

Run this check in `scripts/deploy.sh`, not just CI: the gate exists to keep a pin from reaching the NAS, and a deploy can be driven from a working tree CI never saw.

## Env override is not a pin

`SNITCHMD_IMAGE` set in `~/nanoclaw/.env` on a given box is configuration, not a committed dependency, and is out of the gate's scope. The rule governs the committed default only.

## Surface sync

When the image reference moves or the covered path changes, update in lock-step: this rule's Approved-exception paragraph, the `verify_snitchmd_image_floating` check in `jbaruch/nanoclaw` `scripts/deploy.sh`, the rationale comment beside the constant in `src/ipc-handlers/ops-fetch.ts`, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
