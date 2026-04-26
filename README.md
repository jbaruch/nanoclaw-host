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
| [copilot-nudge-after-10min](rules/copilot-nudge-after-10min.md) | When you summon a Copilot review via the GraphQL `requestReviews` mutation (see the `ship-code` and `promote` skills for the full lifecycle and the exact GraphQL call) and the review hasn't started… |
| [host-conventions](rules/host-conventions.md) | Rules for the NanoClaw host agent (Claude Code on Mac). |
| [repo-chain](rules/repo-chain.md) | Updates flow DOWN the chain: |

## Skills

| Skill | Description |
|-------|-------------|
| [check-staging](skills/check-staging/SKILL.md) | List pending skills and rules on the NAS staging area. Shows what the agent has created or updated that hasn't been promoted to tiles yet. Use before running promote, or when the user asks what's on… |
| [nuke](skills/nuke/SKILL.md) | Kill a running agent container on the NAS by Telegram group JID. The orchestrator respawns a fresh container on the next message. Does NOT delete registration or group folder. Use when a container is… |
| [promote](skills/promote/SKILL.md) | Promote agent-created skills and rules from NAS staging to tile GitHub repos via a full PR lifecycle — opens a PR, summons Copilot, iterates fixups until the review is clean, then merges so GHA… |
| [reconcile](skills/reconcile/SKILL.md) | Verify that all tessl tiles are in sync between git source, tessl registry, and the NAS orchestrator. Reports drift, unpublished content, untracked files, and version mismatches. Use when tile state… |
| [ship-code](skills/ship-code/SKILL.md) | PR-based lifecycle for shipping a code change through the NanoClaw fork chain. Covers the full path on private (jbaruch/nanoclaw) — create PR, summon Copilot, wait for review, fix CI + reasonable… |
| [sync-to-public](skills/sync-to-public/SKILL.md) | Sync private NanoClaw improvements to the public fork. Runs the scrubbed export script, creates a PR for review, and optionally merges. Use when private has accumulated fixes that should go public,… |
| [update-from-public](skills/update-from-public/SKILL.md) | Pull upstream updates into private NanoClaw. The chain is qwibitai → public → private. This skill handles both pulling qwibitai changes into public and then merging public into private. Use when… |

See [CHANGELOG.md](CHANGELOG.md) for version history.
