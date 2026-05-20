---
alwaysApply: true
---

# Post-Merge Publish Watch

## A merge is not a ship

Merging a tile-repo PR puts content on `main`. The post-merge `Review & Publish Tile` workflow is what bumps `tile.json` and pushes the new version to the registry. **If that workflow fails, the registry never sees the new content** — `tessl outdated` reports "all up-to-date" against the prior version, and `tessl update` is a no-op forever.

## Watch the post-merge workflow

After every `gh pr merge` against a tile repo:

- Locate the post-merge `Review & Publish Tile` run for the merge commit's SHA. Match BOTH workflow name and head-SHA (`gh run list --repo jbaruch/<tile-repo> --workflow 'Review & Publish Tile' --json headSha,databaseId,status,conclusion --jq '.[] | select(.headSha == "<merge-sha>")'`; the REST API spells the same field `head_sha`). Don't use `--limit 1` alone.
- Wait for it to finish: `gh run watch <id> --repo jbaruch/<tile-repo> --exit-status`, or poll `status == "completed"`. Don't move on while it's `in_progress`.
- If the conclusion isn't `success`, pull the failed step's log, fix the root cause, and land the fix as a follow-up PR. Re-watch on the new run. Don't force-push to main.
- Every `gh` invocation in this rule MUST pass `--repo` per `nanoclaw-host: repo-chain`.

## Verify before declaring done

Two checks, both required (the bump commit lands locally before the registry POST):

- The bumped `tile.json` is on the source repo's `main` (proves `patch-version-publish` ran).
- The latest `Review & Publish Tile` run on `main` has `conclusion: "success"` (proves the registry POST landed too).
