---
name: update-from-public
description: Pull upstream updates into private NanoClaw. The chain is qwibitai → public → private. This skill handles both pulling qwibitai changes into public and then merging public into private. Use when upstream has new features, when the user asks to update, or when /update-nanoclaw is invoked.
---

# Update from Upstream

Pull updates through the chain: qwibitai/nanoclaw → jbaruch/nanoclaw-public → jbaruch/nanoclaw (private).

**Overview:** Three steps — (1) sync public repo from qwibitai, (2) merge public into private, (3) deploy to NAS. Check the "When NOT to update" section before starting.

## Step 1: Update public from qwibitai

```bash
cd ~/Projects/nanoclaw-public
git fetch origin           # public's own main
git checkout main
git pull origin main

# Add qwibitai as remote if not present
git remote get-url qwibitai 2>/dev/null || git remote add qwibitai https://github.com/qwibitai/nanoclaw.git

git fetch qwibitai
# Preview what will be merged before committing
git diff --stat qwibitai/main
git merge qwibitai/main
# Verify the merge looks correct before pushing
git log --oneline -3
# Resolve conflicts if any, then push
git push origin main
```

## Step 2: Update private from public

```bash
cd ~/Projects/nanoclaw
git fetch upstream         # upstream = jbaruch/nanoclaw-public
# Preview what will be merged before committing
git diff --stat upstream/main
git merge upstream/main
# Verify the merge looks correct before pushing
git log --oneline -3
# Resolve conflicts — private additions may conflict with upstream changes
git push origin main
```

## Step 3: Deploy to NAS

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh"
```

Or if only tiles changed:
```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh --tiles-only"
```

After deploying, verify the deployment succeeded:
```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh --health-check"
# Or check the service is responding, e.g.:
# ssh nas "curl -sf http://localhost:PORT/health"
```

## When NOT to update

- If private has uncommitted work — commit or stash first
- If AyeAye is mid-task — nuke the container first, update, then let it respawn
- If upstream has breaking changes — read the changelog first, test locally

## Conflict strategy

Private always has more code than public (private integrations). When merging:
- **Upstream changed a file we also changed:** read both changes, merge manually
- **Upstream added a file:** accept it (new feature)
- **Upstream deleted a file we modified:** check if our modifications are still needed
- **Our private additions conflict:** keep ours, they're intentionally not in upstream
