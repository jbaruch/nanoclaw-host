---
name: promote
description: Promote agent-created skills and rules from NAS staging to plugin GitHub repos — opens a PR from staging, then hands the review, merge, and publish-confirmation lifecycle to the release skill. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a plugin repo. The promote scripts keep the historical `TILE_NAME` env var.
---

# Promote from Staging

Process steps in order. Do not skip ahead.

Runs the plugin-repo PR lifecycle on content in the agent's NAS staging area. End state is a merged PR whose registry publish has been confirmed through the `coding-policy` release contract — not merely a merged PR. Same review discipline as source-code PRs: no direct pushes to `main`.

## Step 1 — Review what is pending

```bash
./scripts/check-staging.sh
```

Review each item before promoting. Proceed immediately to Step 2.

## Step 2 — Determine the target plugin

Each item belongs to exactly one plugin:

| Content | Target plugin | GitHub repo |
|---------|---------------|-------------|
| Admin/operational skills | `nanoclaw-admin` | jbaruch/nanoclaw-admin (private) |
| Trusted shared operational | `nanoclaw-trusted` | jbaruch/nanoclaw-trusted |
| Security rules for untrusted | `nanoclaw-untrusted` | jbaruch/nanoclaw-untrusted |
| Shared behavior (all containers) | `nanoclaw-core` | jbaruch/nanoclaw-core |
| Host agent conventions | `nanoclaw-host` | jbaruch/nanoclaw-host |

Proceed immediately to Step 3.

## Step 3 — Open the PR

`TILE_NAME` is the env var the scripts read. It keeps its historical spelling — do not substitute a `PLUGIN_NAME` variant, which the scripts do not recognise.

```bash
# Promote a specific skill to a plugin
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh heartbeat

# Promote all skills + rules for a plugin
TILE_NAME=nanoclaw-admin ./scripts/promote-from-host.sh all

# Promote only rules
TILE_NAME=nanoclaw-trusted ./scripts/promote-from-host.sh --rules-only
```

The script clones the plugin repo, validates placement (blocks admin content from untrusted/core), checks for cross-plugin duplicates, copies the artifacts in, runs `tessl skill review --optimize --yes` on each promoted skill, creates a `promote/<timestamp>-<plugin>-<hex>` branch, pushes, opens the PR, and summons the reviewers via the GraphQL `requestReviews` mutation — REST silently drops bot reviewers, see `tile-repo-lib.sh`.

It prints `PR opened: <url>` and `Branch: <name>` — capture both. The `tessl skill review` pass requires `tessl` on the host machine; if unavailable the script warns and skips it, and the first quality gate then happens post-merge in `publish.yml`.

Proceed immediately to Step 4.

## Step 4 — Ship through the release skill

```
Skill(skill: "release")
```

One typed call, and it runs to completion: it watches the PR to a terminal review state, carries the fix loop, merges, and confirms the registry publish. Do not treat its internals as steps of this skill and do not re-enter it partway — invoke it once and branch on what it returns.

Two things this skill owns that `release` cannot know:

**Fix in staging, not in the plugin clone.** When the review asks for a change, edit the NAS staging copy and push the fixup onto the same branch. A fix applied in the clone is regressed by the next re-promote of that skill.

```bash
TILE_NAME=<plugin> ./scripts/push-staged-to-branch.sh \
  <local-staging-dir> <plugin> <branch> "<commit msg>" <skill|all|--rules-only>
```

Inside containers, the equivalent is the `push_staged_to_branch` MCP tool. Both call `scripts/push-staged-to-branch.sh`, which re-summons the reviewers after pushing.

**Never hand-roll the review watch.** `coding-policy: ci-safety` routes it through `skills/release/watch-pr-reviews.sh` alone, which resolves each gating bot's latest verdict by login and owns its own poll interval and give-up budget. A `gh api .../reviews` loop here would re-invent those as agent guesses, and an empty `reviews` array is indistinguishable from "the reviewer has not posted yet" without the watcher's terminal-state contract.

Plugin repos run `publish.yml` on push to `main`, not on `pull_request`, so `gh pr checks` returns nothing at PR time. Do not wait for a green CI box that is not coming.

Proceed immediately to Step 5 once `release` reports the release confirmed.

## Step 5 — Clean up staging copies

Run `/verify-tiles`. The command keeps its historical name; there is no `/verify-plugins`.

Proceed immediately to Step 6.

## Step 6 — Pick up the published version

For the `nanoclaw-host` plugin, run `tessl update` locally to pull the new version. For container plugins, the next `./scripts/deploy.sh` picks them up.

Finish here.

## Non-negotiables

- **Always `--repo`** in every `gh` call. Defaults leak to upstream.
- **Never push directly to `main`** on any plugin repo — always PR.
- **Never edit plugin repos directly** — all content flows through NAS staging → promote / push-staged pipeline.
- **Never report a plugin shipped** on a merge alone — only on the release contract's confirmation.
- **Never hand-roll a review watch or a publish watch** — `Skill(skill: "release")` owns both.
