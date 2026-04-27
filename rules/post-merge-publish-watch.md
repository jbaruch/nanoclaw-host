---
alwaysApply: true
---

# Post-Merge Publish Watch

## A merge is not a ship

Merging a tile-repo PR puts content on `main`. The post-merge `Review & Publish Tile` workflow is what bumps `tile.json` and pushes the new version to the registry. **If that workflow fails, the registry never sees the new content** — `tessl outdated` reports "all up-to-date" against the prior version, and `tessl update` is a no-op forever.

This has happened: `nanoclaw-admin#66` merged with PR-time gates green, then the post-merge skill-review gate scored a touched-but-borderline skill below 85% and failed publish-tile. Nothing surfaced the gap; the fleet kept running pre-merge content while the source repo claimed the merge had landed.

## Watch the post-merge workflow

After every `gh pr merge` against a tile repo:

- Locate the post-merge workflow run for the merge commit's SHA — match by `head_sha`, not by `--limit 1`, since another push could insert between merge and lookup.
- Wait for it to finish (`gh run watch <id> --repo jbaruch/<tile-repo> --exit-status` or poll `status == "completed"`; the `--repo` flag is mandatory per `nanoclaw-host: repo-chain` so the watch can't accidentally target a fork or upstream); don't move on while it's `in_progress`.
- If the conclusion isn't `success`, pull the failed step's log, fix the root cause (most common: skill review below 85% — trim the SKILL.md or extract reference content), and land the fix as a follow-up PR. Re-watch on the new run. Don't force-push to main.

## Verify before declaring done

Two checks, both required (the bump commit lands locally before the registry POST):

- The bumped `tile.json` is on the source repo's `main` (proves `patch-version-publish` ran).
- The latest `Review & Publish Tile` run on `main` has `conclusion: "success"` (proves the registry POST landed too).

Both `gh` invocations include explicit `--repo` per `nanoclaw-host: repo-chain`. The implementation lives in operator scripts; this rule names the contract.

## Why this rule and not "raise the PR-time gate"

PR-time gates already check the score. The post-merge gate scores the **whole** SKILL.md, not just the diff — so a touched-but-already-borderline skill can pass at PR time and fail at publish time. The rule above closes the operator gap; the gate stays as-is.
