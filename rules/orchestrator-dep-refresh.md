---
alwaysApply: true
---

# Orchestrator Dep Refresh

## When this rule fires

`Dockerfile.orchestrator` installs npm packages directly from GitHub repos (e.g. `RUN npm install -g jbaruch/reclaim-tripit-timezones-sync`). When the upstream GitHub repo ships a new version, a default `./scripts/deploy.sh` run does NOT pick it up — even though the script reports "deploy complete" and exits 0. The orchestrator silently keeps running the prior version of the dep.

BuildKit caches `RUN npm install -g <GitHub-repo>` on the Dockerfile string, not on the GitHub repo's current state. A bare `docker compose build --no-cache --pull` followed by `up -d --build` is also unsafe — BuildKit can resurrect an older cached image for the second `--build`.

## How to refresh

When an npm-from-GitHub dep in `Dockerfile.orchestrator` ships a new version, deploy with the `--no-cache` flag:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh --no-cache"
```

The flag (1) propagates `--no-cache --pull` through `container/build.sh` for the agent-runner image, and (2) splits the orchestrator step into separate `docker compose build --no-cache --pull nanoclaw` and `docker compose up -d --force-recreate --no-build nanoclaw` calls — no second `--build` invocation that BuildKit can cache-confuse. Mutually exclusive with `--tiles-only`.

## When NOT to use --no-cache

The default `./scripts/deploy.sh` (no flags) is correct for every other deploy: source-code changes, tessl-tile updates, agent-runner Dockerfile changes that don't touch the GitHub-sourced npm install line. Use `--no-cache` ONLY when an npm-from-GitHub dep version is the actual change you're deploying.

## Verify after refresh

Confirm the new dep version is installed in the running orchestrator before declaring the refresh complete. Substitute `DEP_NAME` with the package name:

```bash
DEP_NAME=reclaim-tripit-timezones-sync
ssh nas "docker exec nanoclaw npm list -g --depth=0 2>&1 | grep \"$DEP_NAME\""
```

If the version is unchanged from before the deploy, the cache wasn't actually busted — investigate before moving on.
