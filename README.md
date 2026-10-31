# jbaruch/nanoclaw-host

[![tessl](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.tessl.io%2Fv1%2Fbadges%2Fjbaruch%2Fnanoclaw-host)](https://tessl.io/registry/jbaruch/nanoclaw-host)

Skills and rules for the NanoClaw host agent (Claude Code on Mac). Plugin promotion, container management, staging checks, repo-chain enforcement.

## Installation

```
tessl install jbaruch/nanoclaw-host
```

## Rules

| Rule | Summary |
|------|---------|
| [sessionize-rendered-capture](rules/sessionize-rendered-capture.md) | Fixed no-argument, read-only My Events capture through the validated existing private browser; installed-provider lookup and bounded output contract. |
| [meeting-chat-context](rules/meeting-chat-context.md) | Actual-main registered-chat evidence, current native member identity, complete bounded context and installed-provider rollout. |
| [construction-journal-authority](rules/construction-journal-authority.md) | Exact owner-bound payment cards, protected append gates, dedicated native Sheets routing and monotone backup/recovery. |
| [agent-container-filter](rules/agent-container-filter.md) | Line-oriented contract for the root repository's agent-container filter and deploy consumers, including infrastructure exclusions and regression coverage. |
| [deployment-marker-windows](rules/deployment-marker-windows.md) | Private deployment window ownership, legacy/schema-1 dual readers and reader-first rollout. |
| [agent-file-permissions](rules/agent-file-permissions.md) | Agent identity, private modes, descriptor-safe privileged repairs, atomic replacement, recovery archives and verification as the agent. |
| [whatsapp-channel-control](rules/whatsapp-channel-control.md) | Fixed-account owner-only channel relinking, private codes, saved-registration confirmation and the bounded live-phone testing authority. |
| [browser-profile-storage](rules/browser-profile-storage.md) | Persistent website sessions and browser password autofill for approved autonomous access, with encrypted storage, private main-tier control, checkpoint recovery, approved CAPTCHA solving and operator MFA. |
| [browser-tailnet-viewer](rules/browser-tailnet-viewer.md) | First-party private noVNC node enrollment, dedicated native state, owner-device TCP443-only policy and finite real-device validation. |
| [boyscout-host](rules/boyscout-host.md) | Host agent owns the full stack (source, plugin repos, scripts, deploy, NAS, containers) — fix any problem you find, except owner's-domain content (SOUL.md, personal skills, group memory). |
| [cross-tier-skill-state](rules/cross-tier-skill-state.md) | Cross-trust-tier skills must persist state under `/workspace/state/<skill-name>/` (RW in every container). Tier-pinned skills may use `/workspace/group/`. |
| [dual-agent-coexistence](rules/dual-agent-coexistence.md) | Two agents (AyeAye and host) update this system asynchronously. Never assume the latest version; never assume the other agent's work is stale or inferior without reading it. |
| [host-conventions](rules/host-conventions.md) | Deployment mechanics: always use `./scripts/deploy.sh`, registry is the delivery artifact, scripts source `scripts/common.sh`. |
| [flight-assist-location](rules/flight-assist-location.md) | Host-owned per-group location schema, owner-only atomic writes, non-owner readers and fresh location use. |
| [group-ipc-snapshots](rules/group-ipc-snapshots.md) | Protected v3 task projections, temporary legacy/v2 compatibility, native floating declarations, exact dispatch/binding proof and ordered reader retirement. |
| [no-deferral](rules/no-deferral.md) | Every session is the only session — fix problems now, not "later". Forbidden-pattern bullets enumerated. |
| [no-error-suppression](rules/no-error-suppression.md) | Never use `\|\| true`, `2>/dev/null`, empty `catch {}`, or any form of silent error swallowing in scripts. If something fails, it must fail visibly. |
| [nuke-semantics](rules/nuke-semantics.md) | Nuke a group = kill the running container only. Never delete registrations or group folders. |
| [orchestrator-dep-refresh](rules/orchestrator-dep-refresh.md) | When an npm-from-GitHub dep in `Dockerfile.orchestrator` ships a new version, the default `./scripts/deploy.sh` does NOT pick it up because BuildKit caches `RUN npm install -g <GitHub-repo>` by Dockerfile string, not by GitHub state. Use `./scripts/deploy.sh --no-cache` and verify the resulting dep version against the running container. |
| [overlay-tile-authoring](rules/overlay-tile-authoring.md) | Authoring contract for per-chat overlay tiles under `containerConfig.additionalTiles`: cadence frontmatter mandatory, one cadence per SKILL.md, reader-without-writer is a release blocker, live-runtime verification before shipped, cross-skill subprocess composition. |
| [persona-persist-direct-push](rules/persona-persist-direct-push.md) | Authority for the content-only `persist_global_file` path: only `groups/global/SOUL.md` and `groups/global/SOUL-untrusted.md` direct-push to main. The gate in `src/git-persist.ts` sends mixed pending changes to a review branch and PR. |
| [post-merge-publish-watch](rules/post-merge-publish-watch.md) | Every plugin-repo merge runs the `coding-policy: ci-safety` release contract through `skills/release` Step 7, never a hand-rolled watch. This plugin's specialization: pass the workflow FILE (`publish.yml`) as `resolve-publish-run.sh`'s `<workflow>` argument, never a display name. A run that can't be resolved is unresolved, never clean. |
| [repo-chain](rules/repo-chain.md) | Pull upstream updates directly into private NanoClaw; require explicit GitHub targets and authorization for upstream contributions. |
| [staging-diff-protocol](rules/staging-diff-protocol.md) | Before judging staging content: diff, read, reason, merge improvements, then decide. Stale = empty diff only. |
| [tessl-version-floating](rules/tessl-version-floating.md) | Authority-of-record for the Runtime-Managed Manifest Carve-Out (approved exception to `coding-policy: dependency-management`). Every covered `tessl.json` declares `"mode": "managed"` and floats `jbaruch/*` at `latest`; third-party pins, except in `jbaruch/nanoclaw`'s two unattended-update manifests where everything floats. Enforcement: `jbaruch/nanoclaw`'s `scripts/deploy.sh` step 3b for that pair, `coding-policy`'s `check-tessl-latest.sh` `SessionStart` hook for the nine plugin repos. |
| [snitchmd-image-floating](rules/snitchmd-image-floating.md) | Reviewed immutable Snitchmd image default, normal pin review and renewal, and unchanged operator override. |
| [sync-cli-floating](rules/sync-cli-floating.md) | The agent image's `reclaim-tripit-timezones-sync` install MUST stay specifier-less (approved exception to `coding-policy: dependency-management`, First-Party Co-Shipped Dependency Carve-Out). `deploy.sh` verifies the bare reference AND the `ADD` refetch trigger directly above it. |
| [learning-evidence-runtime](rules/learning-evidence-runtime.md) | Host-owned scanner dependency and main-only, same-group read-only transcript view; machine contract in `skills/learning-evidence-runtime/runtime.json`. |
| [learning-usage-runtime](rules/learning-usage-runtime.md) | Host-owned usage capture and private projection schema, main-only kernel read-only companion, conservative coverage, per-container bootstrap context and archive-hint rollout. |
| [outbound-delivery-receipts](rules/outbound-delivery-receipts.md) | Protected own-main native delivery intents, complete acknowledgment projection, validated Gmail source references and no-replay recovery. |
| [memory-budget-policy](rules/memory-budget-policy.md) | Fixed immutable host/image memory analyzer, canonical metadata schema, compatible maintenance readers and rollout without memory-write authority. |
| [tessie-host-authority](rules/tessie-host-authority.md) | Protected native vehicle/chat authorization, dynamic non-archived selection, guarded empty-disabled opaque mounts, existing OneCLI gateway injection durable acceptance without automatic replay, and event-bound running-late delegation with a shared two-message limit. |
| [learning-hints-contract](rules/learning-hints-contract.md) | Versioned host message/task hint view, read-only collector scope, refusal behavior and rollout before learning activation. |
| [os-package-floating](rules/os-package-floating.md) | The four covered images use bounded distro package sets under the OS-Package Runtime Carve-Out. Dependabot tracks their pinned bases; `deploy.sh` rebuilds them and rejects packages outside the recorded sets. Browser CI verifies sandbox startup, CDP isolation and profile persistence. |
| [run-ledger-contract](rules/run-ledger-contract.md) | Authority-of-record for the host's `task_occurrences` run ledger: owner, record fields, `schema_version`, admin readers and their fallback, and the cross-pipeline rollout. |
| [task-restart-recovery](rules/task-restart-recovery.md) | Versioned interrupted-attempt intervals, conservative email-claim recovery and compatible reader rollout. |
| [tile-content-pipeline](rules/tile-content-pipeline.md) | Plugin content updates flow through staging → promote (forbids live-NAS edits). Feature-branch PRs against a plugin repo are OK — same review surface. |
| [ugos-compose-projects](rules/ugos-compose-projects.md) | Topology + UI contract for Docker Compose projects on UGOS Pro (NASync) where the compose file is source-of-truth in the repo: `/volume1/docker/<project>` directory symlink, in-repo `.env` symlink, sudo INSERT into UGOS Pro's SQLite DB. UGOS Pro UI is Start/Stop only — never "Edit"; never paste env literals. |

## Skills

| Skill | Description |
|-------|-------------|
| [host-contracts](skills/host-contracts/SKILL.md) | Binding task-specific host procedures; each compact rule requires its full reference before the affected action. |
| [add-ugos-project](skills/add-ugos-project/SKILL.md) | Register a new Docker Compose project on UGOS Pro (NASync) when the compose file lives in the nanoclaw repo. Plumbs the `/volume1/docker/PROJECT_NAME` directory symlink, the in-repo `.env` symlink, and the UGOS Pro SQLite registration row so the project appears in the Projects UI without UGOS rewriting the tracked compose file. Use when adding a new sidecar that needs UGOS Pro UI Start/Stop visibility, when wiring a repo-tracked compose project onto the NASync for the first time, when migrating an existing service to the symlinked-compose topology, or when asked to "register a UGOS project" / "add a sidecar to UGOS Pro". |
| [check-staging](skills/check-staging/SKILL.md) | List pending skills and rules on the NAS staging area. Shows what the agent has created or updated that hasn't been promoted to plugins yet. Use before running promote, or when the user asks what's on staging. |
| [extract-to-overlay](skills/extract-to-overlay/SKILL.md) | Sequential workflow for migrating an admin-plugin skill, rule, or script set into a per-chat overlay plugin. Audits cadence frontmatter, state-plane couplings, and cross-skill imports; moves files across two plugin repos; updates per-group additionalTiles config; ships each side through the publish pipeline; verifies live materialisation. Use when extracting an admin skill to an overlay, refactoring admin content into per-chat plugins, splitting capabilities out of nanoclaw-admin, or wiring additionalTiles for a freshly extracted overlay. |
| [nuke](skills/nuke/SKILL.md) | Kill a running agent container on the NAS by Telegram group JID. The orchestrator respawns a fresh container on the next message. Does NOT delete registration or group folder. Use when a container is stuck, stale, or needs a fresh start. |
| [promote](skills/promote/SKILL.md) | Promote agent-created skills and rules from NAS staging to plugin GitHub repos — opens a PR from staging, then hands the review, merge, and publish-confirmation lifecycle to the release skill. Use when there are new items on staging, after check-staging shows pending items, or when asked to deploy skills, push to production, or publish rules to a plugin repo. The promote scripts keep the historical `TILE_NAME` env var. |
| [reconcile](skills/reconcile/SKILL.md) | Verify that all tessl plugins are in sync between git source, tessl registry, and the NAS orchestrator. Reports drift, unpublished content, untracked files, and version mismatches. Use when plugin state seems wrong, container behavior looks stale, you suspect out-of-sync plugins, or need to check plugin health before a release. Run after promoting skills or after any manual plugin edits. The script keeps its historical name, `./scripts/reconcile-tiles.sh`. |
| [learning-evidence-runtime](skills/learning-evidence-runtime/SKILL.md) | Background reference for the host-owned learning runtime declaration and its consuming boundary. |
| [ship-code](skills/ship-code/SKILL.md) | Ship a committed code change to private NanoClaw (jbaruch/nanoclaw) through a reviewed PR, merge, and branch cleanup. Use when asked to ship a NanoClaw fix, open its PR, or merge its changes. Plugin repositories use the release skill directly. |
| [update-from-upstream](skills/update-from-upstream/SKILL.md) | Pull updates from qwibitai/nanoclaw directly into private NanoClaw through a reviewed PR, then deploy to NAS. Use when upstream has new features, when the user asks to update NanoClaw, or when /update-nanoclaw is invoked. |

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Development dependencies

`tessl.json` declares this repo's dev-time plugin dependencies. See [tessl-version-floating](rules/tessl-version-floating.md) for the carve-out this repo's manifest sits under.

- Every `jbaruch/*` dependency floats at `latest` (Runtime-Managed Manifest Carve-Out, `jbaruch/coding-policy: dependency-management`).
- `jbaruch/coding-policy` also installs the carve-out's deterministic check, the `check-tessl-latest.sh` `SessionStart` hook. Removing the dependency leaves this manifest unchecked.
- `finsi/codex-review` is third-party and pins. Renewal mechanism: `tessl update --yes` runs each session via that hook and rewrites the pin once the registry passes it. Review the resulting manifest diff and land it as its own commit.

Read-only vehicle morning-summary evidence is specified by
`skills/host-contracts/references/tessie-morning-brief.md`; source authority is not
native deployment, complete firmware-alert coverage or vehicle-effect approval.

## Sessionize capture development

The capture runtime uses only Node standard libraries. Its scoped verification
uses `npm ci`, `npm run format:check`, `npm run typecheck` and `npm test`. The
formatter touches only the newly introduced capture/tooling files; existing prose
is outside this adoption. Weekly npm Dependabot renews the pinned development
tools. Node runtime pins in the scoped workflow carry a monthly renewal note.
