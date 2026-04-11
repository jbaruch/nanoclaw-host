---
name: sync-to-public
description: Sync private NanoClaw improvements to the public fork. Runs the scrubbed export script, creates a PR for review, and optionally merges. Use when private has accumulated fixes that should go public, after a batch of improvements, when explicitly asked to sync or export to public, or when asked to push changes or update the public repo with the latest private work.
---

# Sync Private to Public

Export scrubbed snapshot from jbaruch/nanoclaw (private) to jbaruch/nanoclaw-public.

## Prerequisites

- Public repo cloned at `~/Projects/nanoclaw-public`
- `public` remote configured in private repo (already set up)

## Step 1: Dry run

```bash
./scripts/sync-to-public.sh --dry-run
```

Review the output:
- How many files changed
- Check `cd ~/Projects/nanoclaw-public && git diff` for the actual changes

## Step 2: Verify scrubs

After dry run, check that NO private content leaked:

```bash
cd ~/Projects/nanoclaw-public
# Private integrations
grep -rn 'hubitat\|smart_home\|sync_tripit\|fetch_trakt\|sessionize\|audible_backup\|reclaim-tripit' src/ container/ --include='*.ts' | grep -v sync-to-public.sh
# Secrets and personal content
ls dist/ groups/main/ groups/telegram_* scripts/trakt-auth.py scripts/audible-backup.sh src/hubitat-listener.ts docs/OPERATIONS.md 2>&1
# All should be "No such file or directory"
```

If anything leaks, update `scripts/sync-to-public.sh` scrub patterns before proceeding.

## Step 3: Run for real

```bash
./scripts/sync-to-public.sh
```

This creates a `sync/YYYY-MM-DD` branch in the public repo and pushes it.

## Step 4: Create PR

**CRITICAL: Always use --repo to avoid posting to upstream.**

```bash
cd ~/Projects/nanoclaw-public
gh pr create --repo jbaruch/nanoclaw-public --base main --head sync/YYYY-MM-DD \
  --title "sync: scrubbed export from private (YYYY-MM-DD)" \
  --body "Scrubbed export from private. [describe what's new]"
```

## Step 5: Review and merge

Request review (Copilot, manual, or both). Add a comment explaining what to watch for — use `--repo jbaruch/nanoclaw-public` explicitly.

```bash
gh pr merge NUMBER --repo jbaruch/nanoclaw-public --merge
```

## What the script scrubs

**Removed files:** hubitat-listener.ts, trakt-auth.py, audible-backup.sh, SOUL.md, SOUL-untrusted.md (replaced with generic), HEARTBEAT.md, groups/main/, groups/telegram_*/, research/, maintenance/, blog-notes.md, OPERATIONS.md, dist/

**In-file scrubs:** Private IPC handlers and MCP tools (sync_tripit, fetch_trakt_history, sessionize_*, audible_backup), Hubitat config/DB/index, reclaim-tripit Dockerfile dep, private tile deps from tessl.json, private integration names from comments and promote scripts

**Sanitized:** CLAUDE.md kept as upstream generic version, SOUL-untrusted.md replaced with generic template

## Adding new private integrations

When you add a new private integration to the private repo, also update `scripts/sync-to-public.sh`:
1. Add the file to rsync excludes (if it's a new file)
2. Add the handler name to the IPC scrub list (line ~85)
3. Add the tool name to the MCP scrub list (line ~97)
4. Run a dry-run and verify
