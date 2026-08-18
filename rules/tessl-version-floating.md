---
alwaysApply: true
---

# Tessl Version Floating

## Approved exception to `coding-policy: dependency-management`

Authority-of-record for the fleet's Runtime-Managed Manifest Carve-Out. On every manifest named below:

- `"mode": "managed"`. Never `"vendored"`.
- Every `jbaruch/*` dependency at `"version": "latest"`. Never a literal pin.

Third-party dependencies (`finsi/*`, `tessl-labs/*`, `tessl/npm-*`) are outside the carve-out. They pin, with a stated renewal mechanism per `coding-policy: dependency-management` Freshness. The unattended-update set below is the sole exception.

Renewal mechanism for third-party pins in this fleet: `tessl update --yes`, run each session by the hook named below, rewrites any pin the registry has passed. Review the resulting manifest diff and land it as its own commit.

## Covered manifests

Every covered manifest is named explicitly, never matched by glob. Adding one means naming it here in lock-step with wiring its check.

### Unattended-update set — `jbaruch/nanoclaw`

- `tessl-workspace/tessl.json`
- `tessl.json`

Requirements:

- Every dependency floats at `"latest"`, third-party included.
- Deterministic check: `scripts/deploy.sh` step 3b. It fails the deploy on a non-`managed` mode, on any dependency not at `latest`, and on an unreadable manifest.

### Plugin-repo set

The project-root `tessl.json` in each of `jbaruch/nanoclaw-host`, `nanoclaw-admin`, `nanoclaw-core`, `nanoclaw-trusted`, `nanoclaw-untrusted`, `nanoclaw-conferences`, `nanoclaw-media`, `nanoclaw-orders`, `nanoclaw-travel`.

Requirements:

- `jbaruch/*` floats at `"latest"`. Third-party pins.
- Deterministic check: `hooks/check-tessl-latest.sh`, the `SessionStart` hook shipped by `jbaruch/coding-policy`.
- Each repo in this set MUST declare `jbaruch/coding-policy` as a dependency. The check ships with it.

## When `tessl install <plugin>` writes a pin, fix it before commit

- `tessl install jbaruch/<plugin>` writes a literal pin. Edit the entry to `"version": "latest"` before committing.
- If the same install left `"mode": "vendored"` on the manifest, flip it to `"mode": "managed"` in the same edit.
- A third-party install keeps its pin.
