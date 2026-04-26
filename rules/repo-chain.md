---
alwaysApply: true
---

# Repo Chain and Upstream Safety

## The chain

```
qwibitai/nanoclaw (upstream) → jbaruch/nanoclaw-public (public fork) → jbaruch/nanoclaw (private)
```

- **upstream** is the original open-source project. We contribute fixes back via PRs from public.
- **public** is our fork with all improvements, minus private integrations and personal content.
- **private** is the full deployment — public + secrets, private integrations, personal SOUL/groups.

## Direction of flow

Updates flow DOWN the chain:
```
upstream → public → private
```

Contributions flow UP:
```
private → (scrub) → public → (PR) → upstream
```

## Never skip a link

- Private NEVER pulls from upstream directly. It pulls from public.
- Public NEVER pulls from private. It receives scrubbed snapshots via `scripts/sync-to-public.sh`.
- The `upstream` remote in private points to `jbaruch/nanoclaw-public`, NOT `qwibitai/nanoclaw`.

## NEVER interact with upstream repos without explicit permission

**This is non-negotiable.** Do not:
- Create PRs on qwibitai/nanoclaw or any qwibitai/* repo
- Comment on PRs or issues in qwibitai/* repos
- Push branches to qwibitai/* repos

The `gh` CLI defaults to the upstream fork for PRs and comments when working in a fork. **Always use `--repo jbaruch/nanoclaw-public` or `--repo jbaruch/nanoclaw` explicitly.** Never rely on the default.

Why: a misplaced comment or PR on upstream exposes private information to the upstream community. This has happened — it's not hypothetical.

## Always use --repo with gh

Every `gh pr`, `gh issue`, and `gh api` command MUST include an explicit `--repo` flag. No exceptions.

```bash
# WRONG — may default to upstream
gh pr create --base main

# RIGHT
gh pr create --repo jbaruch/nanoclaw-public --base main
```

## Updating private from public

```bash
git fetch upstream
git merge upstream/main
# Resolve conflicts if any
```

This is what `/update-nanoclaw` does.

## Syncing private improvements to public

Run `scripts/sync-to-public.sh` — it:
1. rsync copies all tracked files (minus scrub-list exclusions) to the public repo clone
2. Applies in-file scrubs (removes private IPC handlers, MCP tools, Hubitat, smart home)
3. Creates generic templates (SOUL-untrusted.md)
4. Removes build output (dist/)
5. Commits to a `sync/YYYY-MM-DD` branch
6. Pushes for PR review before merging to public main

Never push directly to public main. Always create a PR and review the diff.
