# jbaruch/nanoclaw-host

[![tessl](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.tessl.io%2Fv1%2Fbadges%2Fjbaruch%2Fnanoclaw-host)](https://tessl.io/registry/jbaruch/nanoclaw-host)

Skills and rules for the NanoClaw host agent (Claude Code on Mac). Tile promotion, container management, staging checks, repo-chain enforcement.

## Installation

```
tessl install jbaruch/nanoclaw-host
```

## Rules

| Rule | Summary |
|------|---------|
| [copilot-nudge-after-10min](rules/copilot-nudge-after-10min.md) | When you summon a Copilot review via the GraphQL `requestReviews` mutation (see the `ship-code` and `promote` skills for the full lifecycle and the exact GraphQL call) and the review hasn't started within 10 minutes, post a follow-up PR comment that tags `@copilot` to re-activate it. |
| [host-conventions](rules/host-conventions.md) | Rules for the NanoClaw host agent (Claude Code on Mac). |
| [post-merge-publish-watch](rules/post-merge-publish-watch.md) | After every tile-repo PR merge, watch the post-merge `Review & Publish Tile` workflow until the registry actually has the new version. A merge that doesn't reach the registry is incomplete. |
| [repo-chain](rules/repo-chain.md) | Updates flow DOWN the chain: |
| [tessl-version-floating](rules/tessl-version-floating.md) | Pins in `tessl-workspace/tessl.json` are correct; the bug is `tessl update` rewriting the manifest in-place without surfacing the bump to git. Each `tessl update` caller must open a `chore/tessl-pin-bump-*` PR with the bump. |

## Skills

| Skill | Description |
|-------|-------------|
| [check-staging](skills/check-staging/SKILL.md) | List pending skills and rules on the NAS staging area. Shows what the agent has created or updated that hasn't been promoted to tiles yet. Use before running promote, or when the user asks what's on staging. |
| [nuke](skills/nuke/SKILL.md) | Kill a running agent container on the NAS by Telegram group JID. The orchestrator respawns a fresh container on the next message. Does NOT delete registration or group folder. Use when a container is stuck, stale, or needs a fresh start. |
| [promote](skills/promote/SKILL.md) | Promote agent-created skills and rules from NAS staging to tile GitHub repos via a full PR lifecycle — opens a PR, summons Copilot, iterates fixups until the review is clean, then merges so GHA publishes. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a tile repo. |
| [reconcile](skills/reconcile/SKILL.md) | Verify that all tessl tiles are in sync between git source, tessl registry, and the NAS orchestrator. Reports drift, unpublished content, untracked files, and version mismatches. Use when tile state seems wrong, container behavior looks stale, you suspect out-of-sync tiles, or need to check tile health before a release. Run after promoting skills or after any manual tile edits. |
| [ship-code](skills/ship-code/SKILL.md) | PR-based lifecycle for shipping a code change through the NanoClaw fork chain. Covers the full path on private (jbaruch/nanoclaw) — create PR, summon Copilot, wait for review, fix CI + reasonable feedback, merge, clean up branches — then cherry-picks what qualifies to public (jbaruch/nanoclaw-public) and repeats the same lifecycle there. Enforces the scrub rules from repo-chain.md. Use when a code change is committed and needs to go out, when asked to ship a fix, open a PR, push to production, merge changes, or propagate a fix from private to public. |
| [sync-to-public](skills/sync-to-public/SKILL.md) | Sync private NanoClaw improvements to the public fork. Runs the scrubbed export script, creates a PR for review, and optionally merges. Use when private has accumulated fixes that should go public, after a batch of improvements, when explicitly asked to sync or export to public, or when asked to push changes or update the public repo with the latest private work. |
| [update-from-public](skills/update-from-public/SKILL.md) | Pull upstream updates into private NanoClaw. The chain is qwibitai → public → private. This skill handles both pulling qwibitai changes into public and then merging public into private. Use when upstream has new features, when the user asks to update, or when /update-nanoclaw is invoked. |

See [CHANGELOG.md](CHANGELOG.md) for version history.
