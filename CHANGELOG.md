# Changelog

## Unreleased

### Rules

- **orchestrator-dep-refresh** (new) — `Dockerfile.orchestrator` installs npm packages directly from GitHub repos (currently `jbaruch/reclaim-tripit-timezones-sync`). When the upstream GitHub repo ships a new version, BuildKit's cache for `RUN npm install -g <GitHub-repo>` does NOT invalidate — the cache key is the Dockerfile string, not the GitHub state — so a default `./scripts/deploy.sh` reports "deploy complete" while the orchestrator silently keeps running the prior dep version. A bare `docker compose build --no-cache --pull` followed by `up -d --build` is also unsafe: BuildKit retains multiple cache entries and can resurrect an older one for the second `--build` invocation, observed 2026-05-02 with `reclaim-tripit-timezones-sync` (a fresh `b147e3b2…` build was overwritten when the subsequent `up -d --build` re-tagged an older `c068384e…` cached image as `:latest`). The rule documents the operator-blessed refresh procedure (`./scripts/deploy.sh --no-cache`, added in `jbaruch/nanoclaw#463`), when to use it (only when an npm-from-GitHub dep version is the change being deployed — `--no-cache` rebuilds every layer from scratch and is wasted CI time otherwise), and a post-deploy verification step (`docker exec nanoclaw npm list -g | grep <package>`) since the failure mode is invisible from the deploy script's exit code alone.

- **post-merge-publish-watch** (new) — A tile-repo PR merge is not the same as a registry publish. The post-merge `Review & Publish Tile` workflow has its own gates (skill review at threshold 85 over the whole skill, lint, the publish action) and can fail after every PR-time check passed. This rule prescribes the watch loop, the failure-fix-republish cycle, and a two-check registry-version verification (repo `tile.json` bump AND workflow conclusion `success`) before declaring the original PR's task done.

- **tessl-version-floating** (new — supersedes the earlier `tessl-version-pin-drift` recipe; filename renamed) — `tessl-workspace/tessl.json` MUST use `"version": "latest"` for every tile, never a literal pin. The owner has approved this as a deliberate exception to `coding-policy: dependency-management`'s pin / lock-file requirement, documented in the rule body as the authority-of-record. Floating versions resolve at install / update time without rewriting the manifest, so the prior 22-day pin-drift bug between git and the running orchestrator (core 0.1.60 → 0.1.87, admin 0.1.101 → 0.1.230, etc.) is structurally impossible. `scripts/deploy.sh` verifies on each deploy that no literal pin has crept in (a `tessl install <tile>` invocation writes a pin by default, so the failure mode is real). Reproducibility is sacrificed by design — the orchestrator is a single deployment we control end-to-end, not a library distributed to third parties; for this one manifest the operational cost of pin drift dominates the value of pin-level reproducibility. `dependency-management` still applies everywhere else in the repo.

### Surface sync

- `tile.json` adds `entrypoint: README.md` per `jbaruch/coding-policy: context-artifacts`.
- `README.md` and `CHANGELOG.md` introduced (none existed previously). Both will be maintained going forward as required by the policy.

The README's rules-table summaries are auto-extracted first-paragraph excerpts from each rule file. Refine them per rule when the wording is misleading; this commit is a structural bootstrap, not authored prose.
