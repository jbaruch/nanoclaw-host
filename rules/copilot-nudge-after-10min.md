# Copilot nudge after 10 minutes

When you summon a Copilot review via the GraphQL `requestReviews` mutation (see `ship-code` skill / `scripts/tile-repo-lib.sh::summon_copilot`) and the review hasn't started within 10 minutes, post a follow-up PR comment that tags `@copilot` to re-activate it.

## Why

GitHub's `requestReviews` call puts Copilot on the PR as a requested reviewer but doesn't always translate into an actual review pass — the bot's queue goes stale silently. The PR UI shows `copilot-pull-request-reviewer` in the "requested reviewers" pane for hours while no work happens. A `@copilot` mention in the PR's conversation reliably re-activates the review.

Observed on 2026-04-20: four admin/core PRs had been summoned via GraphQL and sat idle for 2+ hours; posting `@copilot review` (or a similar tagged comment) got a response within ~30 seconds on every one.

## How to apply

Track each PR's last-summon timestamp alongside the existing review-state watching. If the condition `now - last_summon > 10 minutes AND latest_review_time < latest_commit_time` holds, post a comment:

```bash
gh pr comment <n> --repo <owner>/<repo> --body "@copilot review

Summoned via GraphQL earlier — the requested changes from your previous pass are addressed in the latest commit on this branch. Please re-review."
```

Then reset the summon timestamp for that PR so the nudge doesn't re-fire until another 10 min have passed.

## Scope

Every repo in the chain — core, admin, trusted, untrusted, host, public, private. Applies anywhere `copilot-pull-request-reviewer` is a reviewer on an open PR.

## Don't

- Don't nudge faster than every 10 minutes per PR (you'll just pile up `@copilot` comments with nothing between them).
- Don't nudge if the latest review timestamp is AFTER the latest commit — that means Copilot already saw the current state and chose not to leave line comments (clean review).
- Don't nudge on PRs where Copilot isn't a reviewer (check the `requested_reviewers` list first).
