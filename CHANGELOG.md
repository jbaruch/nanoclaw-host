# Changelog

## Unreleased

### Rules

- **post-merge-publish-watch** (new) — A tile-repo PR merge is not the same as a registry publish. The post-merge `Review & Publish Tile` workflow has its own gates (skill review at threshold 85 over the whole skill, lint, the publish action) and can fail after every PR-time check passed. This rule prescribes the watch loop, the failure-fix-republish cycle, and a two-check registry-version verification (repo `tile.json` bump AND workflow conclusion `success`) before declaring the original PR's task done.

- **tessl-version-pin-drift** (new) — Pins in `tessl-workspace/tessl.json` are correct per `coding-policy: dependency-management`; the bug is `tessl update` rewriting the manifest in-place without surfacing the bump back to git. Each `tessl update` caller (`scripts/deploy.sh`, the 15-min orchestrator catch-up loop, the `tessl_update` MCP tool) must open a `chore/tessl-pin-bump-<epoch-secs>-<rand>` PR via `gh pr create` after a successful update. Direct push to `main` and `[skip ci]` are forbidden per `coding-policy: ci-safety`; the PR flow keeps both branch protections and CI gates intact while the bump still reaches git.

### Surface sync

- `tile.json` adds `entrypoint: README.md` per `jbaruch/coding-policy: context-artifacts`.
- `README.md` and `CHANGELOG.md` introduced (none existed previously). Both will be maintained going forward as required by the policy.

The README's rules-table summaries are auto-extracted first-paragraph excerpts from each rule file. Refine them per rule when the wording is misleading; this commit is a structural bootstrap, not authored prose.
