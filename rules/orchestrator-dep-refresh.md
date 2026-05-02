---
alwaysApply: true
---

# Orchestrator Dep Refresh

## When this rule fires

`Dockerfile.orchestrator` installs npm packages directly from GitHub repos (e.g. `RUN npm install -g jbaruch/reclaim-tripit-timezones-sync`). When the upstream GitHub repo ships a new version, a default `./scripts/deploy.sh` run does NOT pick it up — even though the script reports "deploy complete" and exits 0. The orchestrator silently keeps running the prior version of the dep.

## Why deploy.sh's default path goes stale

BuildKit's cache key for `RUN npm install -g <github-repo>` is the Dockerfile string, NOT the GitHub repo's current state. Once the layer is cached, every subsequent rebuild — including `docker compose up -d --build` — reuses the cached install regardless of whether GitHub has new commits. The cached layer only ever invalidates when an earlier `COPY` or `RUN` step in the Dockerfile gets busted, which is unrelated to whether the github-sourced dep has new code.

A bare `docker compose build --no-cache --pull` followed by a subsequent `up -d --build` is also unsafe: BuildKit retains multiple cache entries and can resurrect an older one for the second `--build`. Reference incident 2026-05-02: a fresh `--no-cache` build produced image `b147e3b2…`, but the subsequent `up -d --build` re-tagged an older `c068384e…` cached image as `:latest` and the running container served pre-update code. Three deploy.sh runs reported "complete" with the prior dep version still installed.

## How to refresh

When an npm-from-github dep in `Dockerfile.orchestrator` ships a new version, deploy with the `--no-cache` flag:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh --no-cache"
```

The flag (1) propagates `--no-cache --pull` through `container/build.sh` for the agent-runner image, and (2) splits the orchestrator step into separate `docker compose build --no-cache --pull nanoclaw` and `docker compose up -d --force-recreate --no-build nanoclaw` calls — no second `--build` invocation that BuildKit can cache-confuse. Mutually exclusive with `--tiles-only`.

## When NOT to use --no-cache

The default `./scripts/deploy.sh` (no flags) is correct for every other deploy: source-code changes, tessl-tile updates, agent-runner Dockerfile changes that don't touch the github-sourced npm install line. `--no-cache` rebuilds every layer from scratch and is wasted CI time when the cache is honest. Use it ONLY when an npm-from-github dep version is the actual change you're deploying.

## Verify after refresh

Confirm the new dep version is actually installed in the running orchestrator before declaring the refresh complete:

```bash
ssh nas "docker exec nanoclaw npm list -g --depth=0 2>&1 | grep <dep-name>"
```

If the version is unchanged from before the deploy, the cache wasn't actually busted — investigate before moving on. The default `--no-cache` path should never reach this state, but the verification step exists because the failure mode (silent stale dep) is invisible from the deploy script's exit code alone.
