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
| [boyscout-host](rules/boyscout-host.md) | Host agent owns the full stack (source, tile repos, scripts, deploy, NAS, containers) — fix any problem you find, except owner's-domain content (SOUL.md, personal skills, group memory). |
| [copilot-nudge-after-10min](rules/copilot-nudge-after-10min.md) | When you summon a Copilot review via the GraphQL `requestReviews` mutation (see the `ship-code` and `promote` skills for the full lifecycle and the exact GraphQL call) and the review hasn't started within 10 minutes, post a follow-up PR comment that tags `@copilot` to re-activate it. |
| [cross-tier-skill-state](rules/cross-tier-skill-state.md) | Cross-trust-tier skills must persist state under `/workspace/state/<skill-name>/` (RW in every container). Tier-pinned skills may use `/workspace/group/`. |
| [dual-agent-coexistence](rules/dual-agent-coexistence.md) | Two agents (AyeAye and host) update this system asynchronously. Never assume the latest version; never assume the other agent's work is stale or inferior without reading it. |
| [host-conventions](rules/host-conventions.md) | Deployment mechanics: always use `./scripts/deploy.sh`, registry is the delivery artifact, scripts source `scripts/common.sh`. |
| [no-deferral](rules/no-deferral.md) | Every session is the only session — fix problems now, not "later". Forbidden-pattern bullets enumerated. |
| [no-error-suppression](rules/no-error-suppression.md) | Never use `\|\| true`, `2>/dev/null`, empty `catch {}`, or any form of silent error swallowing in scripts. If something fails, it must fail visibly. |
| [nuke-semantics](rules/nuke-semantics.md) | Nuke a group = kill the running container only. Never delete registrations or group folders. |
| [orchestrator-dep-refresh](rules/orchestrator-dep-refresh.md) | When an npm-from-GitHub dep in `Dockerfile.orchestrator` ships a new version, the default `./scripts/deploy.sh` does NOT pick it up because BuildKit caches `RUN npm install -g <GitHub-repo>` by Dockerfile string, not by GitHub state. Use `./scripts/deploy.sh --no-cache` and verify the resulting dep version against the running container. |
| [overlay-tile-authoring](rules/overlay-tile-authoring.md) | Authoring contract for per-chat overlay tiles under `containerConfig.additionalTiles`: cadence frontmatter mandatory, one cadence per SKILL.md, reader-without-writer is a release blocker, live-runtime verification before shipped, cross-skill subprocess composition. |
| [post-merge-publish-watch](rules/post-merge-publish-watch.md) | After every tile-repo PR merge, watch the post-merge `Review & Publish Tile` workflow until the registry actually has the new version. A merge that doesn't reach the registry is incomplete. |
| [repo-chain](rules/repo-chain.md) | Updates flow DOWN the chain: |
| [staging-diff-protocol](rules/staging-diff-protocol.md) | Before judging staging content: diff, read, reason, merge improvements, then decide. Stale = empty diff only. |
| [tessl-version-floating](rules/tessl-version-floating.md) | `tessl-workspace/tessl.json` MUST use `"version": "latest"` for every tile (approved exception to `coding-policy: dependency-management`). `deploy.sh` verifies on each deploy that no literal pins have crept in. |
| [tile-content-pipeline](rules/tile-content-pipeline.md) | Tile content updates flow through staging → promote (forbids live-NAS edits). Feature-branch PRs against a tile repo are OK — same review surface. |
| [ugos-compose-projects](rules/ugos-compose-projects.md) | Topology + UI contract for Docker Compose projects on UGOS Pro (NASync) where the compose file is source-of-truth in the repo: `/volume1/docker/<project>` directory symlink, in-repo `.env` symlink, sudo INSERT into UGOS Pro's SQLite DB. UGOS Pro UI is Start/Stop only — never "Edit"; never paste env literals. |

## Skills

| Skill | Description |
|-------|-------------|
| [add-ugos-project](skills/add-ugos-project/SKILL.md) | Register a new Docker Compose project on UGOS Pro (NASync) when the compose file lives in the nanoclaw repo. Plumbs the directory symlink under `/volume1/docker/`, the in-repo `.env` symlink, and the UGOS Pro SQLite registration row so the project appears in the Projects UI without UGOS rewriting the tracked compose file. Use when adding a new sidecar that needs UGOS Pro UI Start/Stop visibility, when wiring a repo-tracked compose project onto the NASync for the first time, or when migrating an existing service to the symlinked-compose topology. |
| [check-staging](skills/check-staging/SKILL.md) | List pending skills and rules on the NAS staging area. Shows what the agent has created or updated that hasn't been promoted to tiles yet. Use before running promote, or when the user asks what's on staging. |
| [extract-to-overlay](skills/extract-to-overlay/SKILL.md) | Sequential workflow for migrating an admin-tile skill, rule, or script set into a per-chat overlay tile. Audits cadence frontmatter, state-plane couplings, and cross-skill imports; moves files across two tile repos; updates per-group additionalTiles config; ships each side through publish-tile; verifies live materialisation. Use when extracting an admin skill to an overlay, refactoring admin content into per-chat tiles, splitting capabilities out of nanoclaw-admin, or wiring additionalTiles for a freshly extracted overlay. |
| [nuke](skills/nuke/SKILL.md) | Kill a running agent container on the NAS by Telegram group JID. The orchestrator respawns a fresh container on the next message. Does NOT delete registration or group folder. Use when a container is stuck, stale, or needs a fresh start. |
| [promote](skills/promote/SKILL.md) | Promote agent-created skills and rules from NAS staging to tile GitHub repos via a full PR lifecycle — opens a PR, summons Copilot, iterates fixups until the review is clean, then merges so GHA publishes. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a tile repo. |
| [reconcile](skills/reconcile/SKILL.md) | Verify that all tessl tiles are in sync between git source, tessl registry, and the NAS orchestrator. Reports drift, unpublished content, untracked files, and version mismatches. Use when tile state seems wrong, container behavior looks stale, you suspect out-of-sync tiles, or need to check tile health before a release. Run after promoting skills or after any manual tile edits. |
| [ship-code](skills/ship-code/SKILL.md) | PR-based lifecycle for shipping a code change through the NanoClaw fork chain. Covers the full path on private (jbaruch/nanoclaw) — create PR, summon Copilot, wait for review, fix CI + reasonable feedback, merge, clean up branches — then cherry-picks what qualifies to public (jbaruch/nanoclaw-public) and repeats the same lifecycle there. Enforces the scrub rules from repo-chain.md. Use when a code change is committed and needs to go out, when asked to ship a fix, open a PR, push to production, merge changes, or propagate a fix from private to public. |
| [sync-to-public](skills/sync-to-public/SKILL.md) | Sync private NanoClaw improvements to the public fork. Runs the scrubbed export script, creates a PR for review, and optionally merges. Use when private has accumulated fixes that should go public, after a batch of improvements, when explicitly asked to sync or export to public, or when asked to push changes or update the public repo with the latest private work. |
| [update-from-public](skills/update-from-public/SKILL.md) | Pull upstream updates into private NanoClaw. The chain is qwibitai → public → private. This skill handles both pulling qwibitai changes into public and then merging public into private. Use when upstream has new features, when the user asks to update, or when /update-nanoclaw is invoked. |

See [CHANGELOG.md](CHANGELOG.md) for version history.
