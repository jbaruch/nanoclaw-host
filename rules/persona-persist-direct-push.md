---
alwaysApply: true
---

# Persona Persist Direct-Push

## Authority-of-record for `coding-policy: ci-safety` Content-Only Direct-Push Carve-Out

The `jbaruch/nanoclaw` `persist_global_file` IPC handler (`src/ipc-handlers/ops.ts`) direct-pushes the operator persona files to the protected `main` branch at runtime, so an operator-approved soul-searching edit survives the next `deploy.sh` `git pull origin main` (`jbaruch/nanoclaw-admin#393`). This file is the authority-of-record that sanctions that direct push under the carve-out.

## Covered paths

- `groups/global/SOUL.md`
- `groups/global/SOUL-untrusted.md`

No other path may direct-push to `main`. Every other change to `jbaruch/nanoclaw` goes through a pull request.

## Why these paths qualify

- Operator persona prose — the agent's voice, preferences, and silence rules — authored and read by the operator, not a `rule` / `skill` / `script` / `manifest` / `workflow` / `configuration` artifact
- Mutated only by the operator-approved in-chat apply flow (`tessl__soul-searching-apply`, entered on Baruch's "apply N" reply)
- The immediate-durability requirement is structural: `deploy.sh` reverts an uncommitted `/workspace/global/` edit, so the approved change must reach `main` to persist

## What the direct-push does NOT carry

- No pull request, no CI run, no gh-aw policy review, no Copilot review
- Compensating controls: operator approval originates the apply; the `#324` confirmation-token gate blocks an untrusted-provenance `persist_global_file` call; the deterministic gate below bounds what can land

## Deterministic push-time gate (carve-out Form B)

- The gate is code, not agent judgment — `validateGlobalFilesToPersist` and the pre-push allowlist check in `persistGlobalFilesToGit`, both in `jbaruch/nanoclaw` `src/git-persist.ts`
- `validateGlobalFilesToPersist` accepts only the exact covered basenames — never a caller-supplied path component (absolute, `..`, or subdir escape rejected)
- Before pushing, `persistGlobalFilesToGit` enumerates every path the push would change on `main` (`git diff --name-only origin/main..HEAD`) and pushes only when ALL match the covered paths
- An out-of-glob path is refused outright (`stage: 'git'` error, no push) — stricter than a branch+PR fallback: nothing but the covered persona files ever direct-pushes

## Surface sync

When the covered-path set changes, update in lock-step: this rule's Covered paths, `PERSISTABLE_GLOBAL_FILES` in `jbaruch/nanoclaw` `src/git-persist.ts`, the `persist_global_file` MCP tool's zod enum, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
