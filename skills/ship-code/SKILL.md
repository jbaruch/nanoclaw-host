---
name: ship-code
description: Ship a committed code change to private NanoClaw (jbaruch/nanoclaw) through a reviewed PR, merge, and branch cleanup. Use when asked to ship a NanoClaw fix, open its PR, or merge its changes. Plugin repositories use the release skill directly.
placement-admin-content-ok: true
skip-optimize: true
---

# Ship Code

Process steps in order. Do not skip ahead.

## Step 1 — Verify the target

- Confirm the checkout's `origin` targets `jbaruch/nanoclaw`.
- Confirm the change is committed on a branch off current `main` and tracked files are clean.
- Follow `rules/repo-chain.md` for explicit GitHub targets and upstream contribution authorization.

Proceed immediately to Step 2.

## Step 2 — Release the private change

Invoke `Skill(skill: "release")` once for `jbaruch/nanoclaw`. It owns PR creation, policy and Copilot review, CI, feedback handling, merge, and branch cleanup. Use explicit repository targets throughout.

If release is blocked, report the blocker and finish here. After the private PR merges and cleanup completes, report its URL and finish here.
