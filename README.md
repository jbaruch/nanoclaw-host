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
| [repo-chain](rules/repo-chain.md) | ``` |

## Skills

| Skill | Description |
|-------|-------------|
| [check-staging](skills/check-staging/SKILL.md) | name: check-staging |
| [nuke](skills/nuke/SKILL.md) | name: nuke |
| [promote](skills/promote/SKILL.md) | name: promote |
| [reconcile](skills/reconcile/SKILL.md) | name: reconcile |
| [ship-code](skills/ship-code/SKILL.md) | name: ship-code |
| [sync-to-public](skills/sync-to-public/SKILL.md) | name: sync-to-public |
| [update-from-public](skills/update-from-public/SKILL.md) | name: update-from-public |

See [CHANGELOG.md](CHANGELOG.md) for version history.
