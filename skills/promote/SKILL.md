---
name: promote
description: Promote agent-created skills and rules from NAS staging to plugin GitHub repos via a full PR lifecycle — opens a PR, summons reviewers, iterates fixups until the policy reviewer clears, then merges and confirms the registry publish through the release contract. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a plugin repo. The promote scripts keep the historical `TILE_NAME` env var.
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

## Step 4 — Wait for the review verdict

The pre-merge gate is the **policy reviewer's posted verdict**, plus the local `tessl skill review --optimize` pass when Step 3 ran it.

Copilot does NOT gate. Per `coding-policy: review-severity`, Copilot findings are always advisory regardless of the state Copilot posts — read them and act on what is right, but never hold a merge on them.

Plugin repos run `publish.yml` on push to `main`, not on `pull_request`, so `gh pr checks` returns nothing at PR time. Do not wait for a green CI box that is not coming.

```bash
gh api repos/jbaruch/<plugin>/pulls/<N>/reviews \
  --jq '.[] | {reviewer: .user.login, state, body: .body[:200]}'
gh api repos/jbaruch/<plugin>/pulls/<N>/comments \
  --jq '.[] | {path, line, body: .body[:200]}'
```

Read every reviewer's body in full before judging any finding non-blocking, per `coding-policy: reviewer-feedback-reading`. Proceed immediately to Step 5.

## Step 5 — Fix what the review found

Blocking findings must be fixed before merge; advisory findings are acknowledged and folded into a round already in flight, per `coding-policy: review-severity`.

**Fix in staging, not in the plugin clone.** Otherwise the next re-promote of the same skill regresses the fix.

```bash
TILE_NAME=<plugin> ./scripts/push-staged-to-branch.sh \
  <local-staging-dir> <plugin> <branch> "<commit msg>" <skill|all|--rules-only>
```

Inside containers, the equivalent is the `push_staged_to_branch` MCP tool. Both call `scripts/push-staged-to-branch.sh`, which re-summons the reviewers after pushing.

Reply on every thread — accepted or declined — so nothing is left dangling:

```bash
# Accepted:
gh api "repos/jbaruch/<plugin>/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Fixed in <sha> — <what changed>."
# Declined:
gh api "repos/jbaruch/<plugin>/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Declining — <reason: out of scope / intentional / conflicts with X>."
```

Repeat Steps 4 and 5 until no blocking finding stands. Proceed immediately to Step 6.

## Step 6 — Merge and confirm the publish

Merging is not shipping. Registry publication is a separate gate, and confirming it is the release contract's three-part conjunction — run `success`, registry advanced past a pre-merge baseline, moderation cleared — never a newest-run glance.

Invoke `Skill(skill: "release")` and follow its merge and Step 7 post-merge verification for this PR. It captures the registry baseline before the merge, resolves the publish run by merge-commit `headSha` + push event + workflow file (`publish.yml`), watches that run to a terminal conclusion, and waits for moderation to clear.

Never substitute `gh run list --limit 1`: it watches whichever run happens to be newest, which is not necessarily the run this merge started. `rules/post-merge-publish-watch.md` forbids the hand-rolled form.

If the post-merge review fails, the registry did not get a new version but the content is on `main`. Open a follow-up PR and run the cycle again — never force-publish around a failing gate.

Proceed immediately to Step 7.

## Step 7 — Clean up staging and pick up the new version

1. Run `/verify-tiles` to clean up staging copies. The command keeps its historical name.
2. For the `nanoclaw-host` plugin, run `tessl update` locally to pull the new version. For container plugins, the next `./scripts/deploy.sh` picks them up.

Finish here.

## Non-negotiables

- **Always `--repo`** in every `gh` call. Defaults leak to upstream.
- **Never push directly to `main`** on any plugin repo — always PR.
- **Never edit plugin repos directly** — all content flows through NAS staging → promote / push-staged pipeline.
- **Never report a plugin shipped** on a merge alone — only on the release contract's confirmation.
