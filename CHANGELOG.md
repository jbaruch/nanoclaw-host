# Changelog

## Unreleased

### Rules

- **post-merge-publish-watch** (new) — Codifies that `gh pr merge` against a tile repo is not "shipped". The post-merge `Review & Publish Tile` workflow has its own gates (`tessl skill review --threshold 85` over the WHOLE skill, lint, the publish action) and can fail after every PR-time check passed. The rule prescribes the watch loop, the failure-fix-republish cycle, and a registry-version verification step before declaring the original PR's task done. Triggered by `nanoclaw-admin#66` (UTC `schedule_value` migration) merging at 20:05Z while the post-merge publish silently failed on `schedule-task` (82% < 85%).

- **tessl-version-floating** (new — filename retained, rule body rewritten per OpenAI policy reviewer feedback on `nanoclaw-host#14`) — Pins in `tessl-workspace/tessl.json` are correct per `coding-policy: dependency-management`; the actual bug is `tessl update` rewriting the manifest in-place without surfacing the bump to git, so a `git pull` rolls the orchestrator back. Codifies that all three `tessl update` callers (`scripts/deploy.sh`, the 15-min orchestrator catch-up loop, the `tessl_update` MCP tool) MUST open a `chore/tessl-pin-bump-<utc>` PR via `gh pr create` after a successful update — never direct-push to `main`, never use `[skip ci]` (both forbidden by `coding-policy: ci-safety`). Reproducibility preserved (the pin in the manifest IS the lock); drift fixed (every bump reaches git through the standard PR flow). Triggered by NAS inspection on 2026-04-27 showing the working tree 22 days behind `main` across every tile (e.g. core 0.1.60 → 0.1.87, admin 0.1.101 → 0.1.229).

### Surface sync

- `tile.json` adds `entrypoint: README.md` per `jbaruch/coding-policy: context-artifacts`.
- `README.md` and `CHANGELOG.md` introduced (none existed previously). Both will be maintained going forward as required by the policy.

The README's rules-table summaries are auto-extracted first-paragraph excerpts from each rule file. Refine them per rule when the wording is misleading; this commit is a structural bootstrap, not authored prose.
