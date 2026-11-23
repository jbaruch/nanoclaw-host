---
name: update-from-upstream
description: Pull updates from qwibitai/nanoclaw directly into private NanoClaw through a reviewed PR, then deploy from the verified runtime checkout. Use when upstream has new features, when the user asks to update NanoClaw, or when /update-nanoclaw is invoked.
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

## Step 4 — Deploy the merged update

Run in the deployment checkout verified under [Host Agent Conventions](../../rules/host-conventions.md).

```bash
./scripts/deploy.sh
```

Use `--tiles-only` for a plugin refresh that needs no source pull or image rebuild. Check the deployment result before reporting success. On Mini a full deploy must pass the script's readiness checks, exit zero and emit `{"schema_version":1,"deployed":true}`. Finish here.
