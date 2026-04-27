# Tessl Version Floating

## Don't pin tile versions in git-tracked tessl.json

The orchestrator's `/app/tessl-workspace/tessl.json` is bind-mounted from `tessl-workspace/tessl.json` in the host repo (per `nanoclaw-host: host-conventions` deploy flow). When `tessl update` runs (deploy.sh, the 15-minute periodic catch-up in the orchestrator, or the `tessl_update` MCP tool), it rewrites the file in-place with the latest registry versions.

Hard pins (`"version": "0.1.50"`) in the git-tracked copy break the loop in two ways:

1. **Drift between git and runtime.** Each `tessl update` mutates the file, leaving the working tree dirty. Nothing auto-commits those bumps, so `git status` accumulates a permanent diff that nobody pushes. A subsequent `git pull` pulls the stale main pins and overwrites the runtime updates — silently rolling back tile versions inside the container.

2. **Misleading semantics.** A literal pin reads as "the operator wanted exactly this version", which is the opposite of the intent. Future agents (or the operator on a long-tail review) might honor the pin and refuse to bump.

## Use floating specifiers instead

In the git-tracked `tessl-workspace/tessl.json`, declare each tile dependency with a floating range that says "always pull the latest compatible":

```json
{
  "name": "nanoclaw-orchestrator",
  "mode": "managed",
  "dependencies": {
    "jbaruch/nanoclaw-core": { "version": "latest" },
    "jbaruch/nanoclaw-admin": { "version": "latest" },
    "jbaruch/nanoclaw-trusted": { "version": "latest" },
    "jbaruch/nanoclaw-untrusted": { "version": "latest" },
    "jbaruch/nanoclaw-host": { "version": "latest" },
    "jbaruch/reclaim-tripit-sync": { "version": "latest" }
  }
}
```

`"latest"` resolves to the latest registry version at install / update time. The git file stays stable; tessl handles version resolution at runtime; `tessl update` becomes idempotent against the file (no rewrites, no drift). Verified 2026-04-27: `tessl install` + `tessl update` against `"version": "latest"` resolved to the live registry version without rewriting the manifest. The other tested forms (`"*"`, an empty object, omission) were rejected as invalid input.

## Deliberate pins ARE allowed — but commit them

If a tile version genuinely needs to be pinned (rolling back a bad release, working around a known regression):

1. Set the literal version in `tessl-workspace/tessl.json` (`"version": "0.1.49"`).
2. **Commit and push the change** in the same operation. Add a CHANGELOG entry on the host repo explaining why.
3. File a follow-up issue describing what needs to be true before the pin can lift.

A pin without a commit is a leak. A pin with a commit is a deliberate hold. The first is a bug; the second is an operations decision.

## How the bug surfaced

Observed 2026-04-27: `tessl-workspace/tessl.json` on the NAS had the working tree 22 days behind `main` (core 0.1.60 → 0.1.87, admin 0.1.101 → 0.1.229, trusted 0.1.30 → 0.1.50, untrusted 0.1.15 → 0.1.26, host 0.1.2 → 0.1.23). The container was running the latest pins thanks to in-place `tessl update`; a fresh `git pull` would have rolled the orchestrator back across the board. Running this rule's `"*"` recipe on the git-tracked file makes the pull safe.

## Doesn't change anything host-side except the file

`tessl install` / `tessl update` / `tessl outdated` all accept floating ranges. The Dockerfile's `COPY tessl-workspace/tessl.json` keeps working unchanged. The 15-minute orchestrator catch-up keeps working unchanged. Only the file's syntax shifts.
