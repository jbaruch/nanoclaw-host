---
alwaysApply: true
---

# Tessl Version Floating

## Approved exception to `coding-policy: dependency-management`

Authority-of-record for the fleet's Runtime-Managed Manifest Carve-Out. Two requirements, on every manifest named below:

- `"mode": "managed"` — never `"vendored"`. Vendored is a lie when `.tessl/` is gitignored and the content is not committed.
- Every `jbaruch/*` dependency at `"version": "latest"` — never a literal `0.1.x` pin.

Third-party dependencies (`finsi/*`, `tessl-labs/*`, `tessl/npm-*`) are **outside the carve-out**. They pin, with a renewal cadence documented beside the pin, per `coding-policy: dependency-management` Freshness. The unattended set below is the one exception, and it is exempt for a mechanical reason, not a stylistic one.

## Covered manifests

The carve-out requires every covered manifest named explicitly — never a glob, which would wildcard the exception and silently enrol manifests nobody reviewed. Two sets, with different requirements and different enforcement. Adding a manifest means naming it here in lock-step with wiring its check.

### Unattended-update set — `jbaruch/nanoclaw`

- `tessl-workspace/tessl.json` — orchestrator workspace manifest
- `tessl.json` — project-root manifest

**Every** dependency floats here, third-party included. `tessl update` does not honour a behind-latest pin; it rewrites the specifier in the manifest, in place. Three unattended callers run it against these two files — `scripts/deploy.sh`, the orchestrator's 15-minute catch-up loop in `src/index.ts`, and the `tessl_update` MCP tool in `src/ipc.ts` — none of them on a working tree anyone reviews. A pin here is rewritten on the NAS with no commit behind it, and the next `git pull` reverts the rewrite and rolls the deployment backward against the registry. Floating is the only state that survives its own tooling.

Deterministic check: `scripts/deploy.sh` step 3b, which fails the deploy on a non-`managed` mode, on any dependency not at `latest`, or on an unreadable manifest.

### Plugin-repo set

The project-root `tessl.json` in each of `jbaruch/nanoclaw-host`, `nanoclaw-admin`, `nanoclaw-core`, `nanoclaw-trusted`, `nanoclaw-untrusted`, `nanoclaw-conferences`, `nanoclaw-media`, `nanoclaw-orders`, and `nanoclaw-travel`.

`jbaruch/*` floats, third-party pins — the carve-out's default shape. `scripts/deploy.sh` runs in `jbaruch/nanoclaw`'s tree and never sees these repos, so the deploy gate is not the check here.

Deterministic check: `hooks/check-tessl-latest.sh`, the `SessionStart` hook shipped by `jbaruch/coding-policy`, which flags any `jbaruch/*` dependency not at `latest`. The carve-out accepts a plugin-shipped session hook in place of a deploy gate, so this is enforcement, not an honour system — but only where the hook is installed. **Every repo in this set MUST declare `jbaruch/coding-policy` as a dependency.** Drop it and the manifest keeps its requirements and loses its only check.

## A third-party pin does not hold itself

The same `tessl update --yes` that hook runs each session rewrites third-party pins too, the moment upstream publishes past the pin. So the renewal mechanism `coding-policy` Freshness demands is not a calendar reminder to go bump the pin — the tooling bumps it and leaves the manifest diff sitting in the working tree. Reviewing that diff is the renewal. Land it as its own commit, never folded into whatever branch happened to be open.

A pin that equals latest looks stable and is not. It has simply not been overtaken yet.

## When `tessl install <plugin>` writes a pin, fix it before commit

`tessl install jbaruch/<plugin>` writes a literal pin (there is no flag for floating). Edit the just-installed entry to `"version": "latest"` BEFORE committing. If the same install left `"mode": "vendored"` on the surrounding manifest, flip it to `"mode": "managed"` in the same edit. A third-party install keeps its pin — that one is correct as written.
