# Post-Merge Publish Watch

## A merge is not a ship

Merging a tile-repo PR (`jbaruch/nanoclaw-{core,admin,trusted,untrusted,host}`) only puts content on `main`. The post-merge `Review & Publish Tile` workflow is what bumps `tile.json` and pushes the new version to the registry. **If that workflow fails, the registry never sees the new content** — `tessl outdated` will report "all up-to-date" because the version it knows about is still the previous one, and the orchestrator's `tessl update` will be a no-op forever.

This has happened: `nanoclaw-admin#66` (the UTC `schedule_value` migration) merged with all PR-time gates green, then the post-merge `Review & Publish Tile` failed the `tessl skill review --threshold 85` gate on `schedule-task` (82%, two points short). The PR author moved on; nothing in the orchestrator surfaced the gap. The fleet stayed on the pre-migration content while the source repo claimed the migration had landed.

## Always watch the post-merge workflow

After every `gh pr merge` against a tile repo:

1. Find the post-merge run — it triggers on `push` to `main` with the `Review & Publish Tile` workflow name:

```bash
gh run list --repo jbaruch/<tile-repo> --branch main --workflow 'Review & Publish Tile' --limit 1 \
  --json databaseId,status,conclusion --jq '.[0]'
```

2. Wait for it to finish (`gh run watch <id> --repo <repo> --exit-status`) or poll until `status == "completed"`. Don't move on while it's `in_progress`.

3. If `conclusion != "success"`:
   - Pull the failed step's log: `gh run view <id> --repo <repo> --log-failed | tail -100`
   - Fix the root cause (most common: `tessl skill review` score below 85% on a touched skill — trim the SKILL.md or extract reference content).
   - Land the fix as a follow-up PR against the same tile repo (NOT a force-push to main).
   - Repeat the watch on the new post-merge run.

4. Only declare the original PR's task done once the registry has the new version. Verify:

```bash
gh api repos/jbaruch/<tile-repo>/contents/tile.json --jq '.content' | base64 -d | grep '"version"'
```

The version field should have moved past whatever it was before the original PR merged.

## Why this rule and not "make the threshold a PR-time check"

The threshold check IS a PR-time check (Copilot + the policy reviewers run during the PR). The post-merge gate scores the **whole** SKILL.md, not just the diff — so a touched-but-already-borderline skill can pass at PR time and fail at publish time. That asymmetry is the publish gate doing its job; the rule above closes the operator gap, not the gate.
