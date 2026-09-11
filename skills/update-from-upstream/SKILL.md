---
name: update-from-upstream
description: Pull updates from qwibitai/nanoclaw directly into private NanoClaw through a reviewed PR, then deploy to NAS. Use when upstream has new features, when the user asks to update NanoClaw, or when /update-nanoclaw is invoked.
---

# Update from Upstream

Process steps in order. Do not skip ahead.

## Step 1 — Verify readiness

Work in the private `jbaruch/nanoclaw` checkout. Follow `rules/repo-chain.md` for repository targets.

- If private has uncommitted work, preserve it before updating.
- If AyeAye is mid-task, arrange a safe interruption before deployment; invoke `Skill(skill: "nuke")` when the interruption is authorized.
- Read upstream release notes for breaking changes and identify the local tests required.

Proceed immediately to Step 2.

## Step 2 — Merge upstream on a branch

Fetch and fast-forward private `main` from `origin`, then create an isolated update branch per `coding-policy: agent-worktree-isolation`.

Verify the `upstream` remote targets `qwibitai/nanoclaw`. Add it if absent or replace a retired public-fork URL before fetching. Fetch `upstream`, inspect the incoming commits and diff against `upstream/main`, then merge `upstream/main` into the update branch.

Resolve conflicts by reading both changes. Preserve private integrations and personal configuration. Check whether private modifications remain necessary when upstream deletes a file. Run the relevant tests and inspect the final diff for unintended removals.

Proceed immediately to Step 3.

## Step 3 — Ship the private update

Invoke `Skill(skill: "ship-code")` for the update branch in `jbaruch/nanoclaw`. Do not push directly to `main`.

Proceed immediately to Step 4 only after the private PR is merged. If shipping is blocked, report the blocker and finish here without deploying.

## Step 4 — Deploy to NAS

Run from the NAS checkout:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh"
```

For plugin-only changes, use `./scripts/deploy.sh --tiles-only` instead; the flag keeps its historical spelling.

Verify the deployment:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh --health-check"
```

Report any deployment or health-check failure. Finish here.
