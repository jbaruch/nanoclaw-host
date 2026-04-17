---
name: ship-code
description: PR-based lifecycle for shipping a code change through the NanoClaw fork chain. Covers the full path on private (jbaruch/nanoclaw) — create PR, summon Copilot, wait for review, fix CI + reasonable feedback, merge, clean up branches — then cherry-picks what qualifies to public (jbaruch/nanoclaw-public) and repeats the same lifecycle there. Enforces the scrub rules from repo-chain.md. Use when a code change is committed and needs to go out, when asked to ship a fix, open a PR, push to production, merge changes, or propagate a fix from private to public.
placement-admin-content-ok: true
skip-optimize: true
---

# Ship Code

Standard lifecycle for a code change in this monorepo. Follows the fork chain defined in `repo-chain.md`: changes land on **private** first, then appropriate commits cherry-pick to **public**. Never push to `main` on either side.

## Prerequisites

- Change committed on a branch off the current `main`.
- Working tree clean for tracked files (ignored files may be present).
- You've read `repo-chain.md` — never touch upstream repos, always use the `--repo` flag.

---

## Phase A — Private repo (jbaruch/nanoclaw)

### 1. Create the PR

```bash
git push -u origin <branch>
gh pr create --repo jbaruch/nanoclaw --base main \
  --title "<type>(<scope>): <imperative summary>" \
  --body "$(cat <<'EOF'
## Summary
<what + why; link issues if any>

## Test plan
- [x] <what you verified>
- [ ] <manual steps remaining>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 2. Summon Copilot for review

Copilot auto-reviews some PRs but not all. Always request explicitly.

**Important gotcha**: the REST endpoint `POST /requested_reviewers` silently drops bot reviewers — it returns `201` but `requested_reviewers` stays empty, and Copilot never posts a review. The correct path is the GraphQL `requestReviews` mutation with `botIds`:

```bash
# One-time: resolve the Copilot bot's node ID (BOT_kgDOCnlnWA at the time of writing).
# If unknown, fish it out of a past PR review:
#   gh api graphql -f query='{ repository(owner:"jbaruch",name:"nanoclaw") {
#     pullRequest(number: 45) { reviews(first:5) { nodes {
#       author { login ... on Bot { id } } } } } } }'

PR_ID=$(gh api graphql -f query='{ repository(owner:"jbaruch",name:"nanoclaw") {
  pullRequest(number: <N>) { id } } }' --jq .data.repository.pullRequest.id)

gh api graphql -f query='
mutation($prId: ID!, $botIds: [ID!]!) {
  requestReviews(input: { pullRequestId: $prId, botIds: $botIds, union: true }) {
    pullRequest { number }
  }
}' -F prId="$PR_ID" -F 'botIds[]=BOT_kgDOCnlnWA'
```

Verify with `gh api repos/jbaruch/nanoclaw/pulls/<N> --jq '.requested_reviewers[].login'` — you should see `Copilot`.

### 3. Wait for review + CI

Don't rush. Let both complete:

```bash
gh pr checks <N> --repo jbaruch/nanoclaw
gh api repos/jbaruch/nanoclaw/pulls/<N>/reviews \
  --jq '.[] | select(.user.login | contains("opilot")) | {state, body: .body[:120]}'
gh api repos/jbaruch/nanoclaw/pulls/<N>/comments \
  --jq '.[] | {path, line, body: .body[:200]}'
```

### 4. Fix what's fixable

- **CI**: fix every failing check. No exceptions.
- **Copilot**: apply what's **right and reasonable**. Push back (with a reply) on anything that misreads scope or suggests over-engineering. Reply on **every** thread — accepted or declined — so nothing is left dangling:

```bash
# Accepted:
gh api "repos/jbaruch/nanoclaw/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Fixed in <sha> — <what changed>."
# Declined:
gh api "repos/jbaruch/nanoclaw/pulls/<N>/comments/<COMMENT_ID>/replies" \
  -X POST -f body="Declining — <reason: out of scope / intentional / conflicts with X>."
```

Push fixes to the same branch. CI re-runs automatically.

### 5. Merge + cleanup

Only when CI is green and all Copilot threads are replied to:

```bash
gh pr merge <N> --repo jbaruch/nanoclaw --merge --delete-branch
git checkout main
git pull --ff-only origin main
git branch -d <branch>      # -d refuses if not merged — safety
git remote prune origin     # clean stale remote-tracking refs
```

---

## Phase B — Public repo (jbaruch/nanoclaw-public)

Not every private commit goes public. Apply the scrub rules from `repo-chain.md` and `scripts/sync-to-public.sh`.

### 6. Decide what qualifies

**Skip** the commit if it touches any of:

- `scripts/trakt-auth.py`, `scripts/audible-backup.sh` — private integration scripts
- `src/hubitat-listener.ts` — private integration
- Private IPC handlers / MCP tools (`sync_tripit`, `fetch_trakt_history`, `sessionize_*`, `audible_backup`) in `src/ipc.ts` or `container/agent-runner/src/ipc-mcp-stdio.ts`
- `groups/main/`, `groups/telegram_*/` — personal group content
- `docs/OPERATIONS.md` — private ops notes
- `.env`, `dist/`, any secret — never

**Ship** if the commit is a generic improvement (bug fix, feature, refactor, test) touching shared code.

The authoritative scrub list is in `scripts/sync-to-public.sh` (`EXCLUDES` array + the two in-file Python regex lists). Read it before shipping if uncertain.

### 7. Cherry-pick + run Phase A on public

Work in the public clone (default `~/Projects/nanoclaw-public`):

```bash
cd ~/Projects/nanoclaw-public
git checkout main && git pull --ff-only origin main
git checkout -b <same-branch-name-as-private>
git cherry-pick <private-commit-sha>    # or a range
```

If cherry-pick conflicts on private-only code: resolve by dropping those hunks — they must not reach public. Verify with:

```bash
git diff main...HEAD -- scripts/ src/ container/ | grep -E 'hubitat|sync_tripit|fetch_trakt|sessionize|audible_backup|trakt-auth' && echo "LEAK — fix before pushing" || echo "clean"
```

Then re-run Phase A (steps 1–5) against `jbaruch/nanoclaw-public` — same PR template, same Copilot request, same CI/review cycle, same merge + cleanup. Replace every `jbaruch/nanoclaw` with `jbaruch/nanoclaw-public` in the `gh` commands.

### 7b. Reconciling divergent Copilot feedback between repos

Copilot reviews each repo independently. The private and public PR for "the same" change can get different comments — either because one got summoned and the other didn't, or because Copilot noticed something different the second time. Decision tree:

| Case | What to do |
|---|---|
| Public Copilot catches a real bug that private Copilot missed (or was never asked) | Fix on public as normal. Then **push the same fix to private**. If private is merged, a direct push to `main` is OK *only when the diff is bit-for-bit identical to what public Copilot already approved*. Otherwise open a tiny private PR. |
| Private Copilot caught something and you've already fixed it there, public Copilot asks about the same thing | Reply on public with a pointer to the private thread/commit: *"Applied on private in `<sha>` — porting the same fix here in `<sha>`."* |
| Public Copilot asks for something you explicitly declined on private | Reply with the private rationale verbatim, link the private thread. Don't re-litigate. |
| Public Copilot proposes something orthogonal (only relevant to public) | Handle locally. Don't propagate to private. |

**Rule of thumb: the two repos must stay semantically identical** on any file that isn't in the scrub list. If a Copilot-validated fix lands on one, it lands on both — otherwise the next `sync-to-public.sh` or `update-from-public` will surface the drift as a churn commit.

When you push the fix to private directly (rather than via PR), the commit message should reference the public PR and explain why the PR gate is being bypassed:

```
test: clarify TRIGGER_PATTERN comment — sync from nanoclaw-public#22

Copilot review on the public counterpart pointed out that the
test name/comment said "word boundary" but the actual gate is
`(?:^|\s)` — `\b` is satisfied at end-of-string regardless.
Applying the same wording here so the two repos don't drift.
```

## Non-negotiables

- **Always `--repo`.** `gh` defaults to upstream (qwibitai) on forks and will leak. No exceptions.
- **Never push directly to `main`** on either side.
- **Never cherry-pick a commit that still touches the scrub list** — rewrite locally (or skip the commit entirely).
- **Never interact with `qwibitai/*` repos** without explicit user permission.

## When to use batch sync instead

This skill is for **per-change** ship. When a batch of private-only improvements has accumulated and you want a bulk scrubbed export, use the **`sync-to-public`** skill instead — it runs the full `rsync` + scrub pipeline in one go. Don't mix: cherry-pick OR batch sync for a given set of changes, not both.
