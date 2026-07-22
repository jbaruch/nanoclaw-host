# Changelog

## Unreleased

### Rule — persona-persist path refs follow the #845 ipc.ts split (2026-07-21)

`jbaruch/nanoclaw` PR #864 (#845 slice 6) moves the `persist_global_file` handler out of the legacy `processTaskIpc` switch into `src/ipc-handlers/ops.ts` and the persist machinery (`validateGlobalFilesToPersist`, `persistGlobalFilesToGit`, `PERSISTABLE_GLOBAL_FILES`) into the new `src/git-persist.ts`. `persona-persist-direct-push` is the authority-of-record naming those file paths, so this change updates its three `src/ipc.ts` references in lock-step per `coding-policy: context-artifacts` Surface Sync. Gate semantics unchanged — same functions, same allowlist, new home.

### Rule — cadence cap must not equal a cron-interval multiple (2026-07-17)

`overlay-tile-authoring` gains a cadence-authoring invariant: a precheck's `CADENCE` cap must not equal an exact integer multiple of the skill's cron period. The cursor stamps at run completion, so a multiple near-misses — on a weekly cron a 168h cap leaves every fire ~167.8h old and skips forever; on a daily cron an N-day-multiple slips a whole period. This is the fleet-wide bug behind `jbaruch/nanoclaw#803`, which `jbaruch/nanoclaw-admin#353`/#354 had to hand-fix twice before it was generalised. The rule prescribes sub-multiple caps with slack (`6d`/`13d` weekly, `36h`/`60h` daily), names the per-skill `near_miss` test as the author-time gate, and points at the `detectCadenceCapRace` runtime warn-not-skip net added in `jbaruch/nanoclaw` `src/cadence-registry.ts` (#803).

### Rule — persona-persist-direct-push authority-of-record (2026-06-21)

`jbaruch/nanoclaw` PR #700 (`jbaruch/nanoclaw-admin#393`) adds a `persist_global_file` IPC handler that direct-pushes the operator persona files to `main` at runtime so an operator-approved soul-searching edit survives the next `deploy.sh` `git pull` — the edit otherwise lived only in the deploy-ephemeral `/workspace/global/` mirror and was reverted every deploy. A direct push to a protected branch needs the `coding-policy: ci-safety` Content-Only Direct-Push Carve-Out, which requires an authority-of-record rule in the governing plugin naming the exact paths, why they qualify, what review the push skips, and the deterministic push-time gate. This rule is that record: it covers `groups/global/SOUL.md` + `groups/global/SOUL-untrusted.md` only, classifies them as operator persona prose (not code/rules/skills/manifests), and names the Form-B gate — `validateGlobalFilesToPersist` + the pre-push `git diff --name-only origin/main..HEAD` allowlist check in `jbaruch/nanoclaw` `src/ipc.ts`, which refuses any out-of-glob path outright. Modeled on `tessl-version-floating` (the authority-of-record for the `dependency-management` carve-out).

**Surface sync:** `rules/persona-persist-direct-push.md` (new), `tile.json` (rules entry), `README.md` (rules table).

### Rule + skill — UGOS Pro symlinked-compose-project topology (2026-05-23)

`jbaruch/nanoclaw` PR #610 (NAS-LiteLLM router) plus follow-ups #621, #623, #624, #626, #627 empirically discovered a non-obvious workflow for running a Docker Compose project on UGOS Pro / NASync while keeping the compose file in the repo as source-of-truth. The proven pattern took 4–5 rounds of mistakes to land on — each mistake's failure mode was UGOS Pro rewriting the compose file at the symlinked path and leaking secrets or UI-entered config back into the tracked repo file. A close-call on 2026-05-23 caught one such rewrite before any git contamination, motivating this rule + skill.

**New rule `ugos-compose-projects`** (always-on) codifies the contract:

- Topology — `/volume1/docker/<project>/` directory symlink to the in-repo dir; `<repo>/container/<project>/.env` → `../../.env` resolves through both layers to `~/nanoclaw/.env`; compose YAML carries `${VAR}` placeholders only and docker compose interpolates from the symlinked `.env` at spawn time
- Registration is a sudo INSERT into `/volume1/@appstore/com.ugreen.docker/db/docker_info_log.db` table `compose`; the row's `path` column points at the symlinked compose path. UGOS Pro's "Create Project" UI flow is forbidden — it rewrites the compose file at the symlinked path
- UI is Start/Stop only — never "Edit"; never paste env literals; UGOS dumps UI-entered env into the compose file's `environment:` block and the dir symlink lands those literals in the tracked repo file
- Surface sync — DB row, dir symlink, `.env` symlink, `deploy.sh` agent-kill grep predicates that match `^<project>` or `^nanoclaw-`, the consuming repo's CHANGELOG

**New skill `add-ugos-project`** walks an operator/agent through registering a new compose project: confirm `<project-name>` + `<in-repo-dir>`; run `register-ugos-project.sh` to plumb the symlinks and stage the INSERT helper on the NAS; run the printed sudo command from an interactive TTY (the script cannot run sudo non-interactively); Start the project from UGOS Pro UI; verify a Stop+Start round-trip preserves the compose-file byte count exactly (the regression-mode check that catches a UGOS UI rewrite). Five sequential steps, em-dash headings, typed cross-reference to the rule.

**New script `skills/add-ugos-project/scripts/register-ugos-project.sh`** is the deterministic plumbing per `coding-policy: script-delegation`: validates the compose file exists on the NAS via SSH, creates or verifies the `/volume1/docker/<project>` directory symlink (refuses when an existing symlink points elsewhere), creates the in-repo `.env` symlink (skipped when the in-repo dir is the repo root since `.env` is already there), writes a Python INSERT helper to `/tmp/register-ugos-<project>.py` on the NAS (with a `name` uniqueness pre-check), prints the operator-facing sudo command on stderr, and emits a JSON summary on stdout including the baseline compose byte count for Step 5's verification. Writing the helper script to a tmp file on the NAS dodges the six-level shell/Python/SQLite escape stack that direct in-script INSERT generation would require.

### Rules — plugin-evals closed-loop carve-out (2026-05-22)

`jbaruch/nanoclaw-host` claims the closed-loop automated-system carve-out in `jbaruch/coding-policy: rules/plugin-evals.md` and ships no `evals/**` scenarios. The entire `nanoclaw-*` tile family is owner-approved exempt from `plugin-evals`'s Coverage and Persistence sections — eval output has no human consumer and gates no downstream automated action. Re-introducing any consumption requires re-introducing evals first under the standard requirement.

### Rule + skill — overlay tile authoring contract and extract-to-overlay workflow

Lessons learned shipping `nanoclaw-flight-assist` (the first per-chat overlay tile under `jbaruch/nanoclaw#305`) surfaced four distinct silent-no-op failure modes in v0.1.7–v0.1.10:

- **Issue #17** (precheck wake never scheduled) — `SKILL.md` shipped without `cadence:` + `script:` frontmatter, so `cadence-registry` never provisioned a `scheduled_tasks` row. The skill installed, scripts ran, exit 0, zero data flowed. Caught only when the operator stood at Arlanda on 2026-05-20 with two live KL flights and no notifications.
- **Issue #21** (sync_tripit not scheduled) — `sync_tripit.py` shipped with a docstring claim "Run cadence: daily at ~04:00 local" but no registry entry. Each SKILL.md owns exactly one `scheduled_tasks` row; multiplexing two cadences in one skill is not supported. Fix extracted `skills/sync-tripit/` as a second skill directory.
- **Issue #20** (byAir HTTP 400) — MCP client sent `Accept: application/json` only; endpoint required `application/json, text/event-stream` per the streamable-HTTP spec. Mocked unit tests stayed green through the entire failure window.
- **Issue #18** (reader-without-writer) — `time_to_leave` consumed `/workspace/state/flight-assist/current-location.json` per `cross-tier-skill-state.md`, but the orchestrator-side writer was deferred as "follow-up host PR" in the PR body with no tracked issue. Plugin shipped silently degraded.

All four share one shape: skill exists, tile installs, env resolves, exit 0, no data flow. The broader silent-no-op pattern — `task_run_logs.status='success'` with `duration<10s` and empty result — has been observed across multiple maintenance fires; the heartbeat-crash incident is the same shape.

**New rule `overlay-tile-authoring`** (always-on) codifies the contract:

- Cadence frontmatter is mandatory (both `cadence:` + `script:` or both absent)
- One cadence per SKILL.md (second axis = second skill directory)
- Reader-without-writer is a release blocker (carve-out for ladder-fallback degraded mode with tracked writer issue + tests for both paths)
- Live-runtime verification before shipped (`scheduled_tasks` row probe + MCP/API handshake)
- Cross-skill subprocess composition (no in-process sibling imports; mount-path runtime resolution with dev-clone fallback)

**New skill `extract-to-overlay`** is the migration workflow this rule's contract executes against. Seven sequential steps: identify candidate + target, audit (cadence + state-plane + cross-skill imports for skills; scope + links for rules), move artifacts across two tile repos with full tile.json/README/CHANGELOG updates on both sides, ship target tile via `Skill(skill: "release")` from `jbaruch/coding-policy`, update per-group `containerConfig.additionalTiles` (now safe because target is in registry), ship source tile via `Skill(skill: "release")`, post-deploy live verification with cadence-conditional probes. Step ordering puts target publish before additionalTiles write (so the IPC validator accepts the new tile) and additionalTiles write before source publish (so chats don't get stranded). Conditional sub-tasks for cadence-declared vs. user-driven skill artifacts vs. rule artifacts keep all paths in one skill rather than splitting. Scoped to migrations from `nanoclaw-admin` to existing overlay tiles; brand-new overlay tile scaffolding deliberately out of scope.

Skill review: 90% (description 100%, content 77%).

### Rules — structural split of `host-conventions` per `coding-policy: context-artifacts`

Split the 11-H2 `host-conventions.md` into 8 single-concept rules per `Rules Are Prose → One concept per rule file`. Trimmed `host-conventions.md` to the three deployment-mechanics sections (deploy.sh, registry, common.sh); the other eight concepts moved to standalone rules:

- **nuke-semantics** (new) — group nuke = kill container only; never delete registrations or group folders
- **no-error-suppression** (new) — forbids `|| true`, `2>/dev/null`, empty `catch {}`, silent swallowing
- **dual-agent-coexistence** (new) — AyeAye + host agent run asynchronously; never assume the latest version or that the other's work is stale
- **staging-diff-protocol** (new) — diff/read/reason/merge before promoting staging content; "stale" = empty diff only
- **no-deferral** (new) — every session is the only session; forbidden-pattern bullets
- **boyscout-host** (new) — host agent owns the full stack; in-scope/out-of-scope split with owner's-domain carve-out
- **tile-content-pipeline** (new — replaces "Never edit tile repos directly") — staging→promote pipeline for live-NAS edits; explicitly carves out feature-branch PRs against tile repos as the same review surface, resolving the conflict between the old wording and `feedback_plugin_repo_prs_ok` agent memory
- **cross-tier-skill-state** (new) — `/workspace/state/<skill-name>/` for skills crossing trust tiers; `/workspace/group/` for tier-pinned

Trimmed `host-conventions.md` from 91 body lines (post-tier-3) to 17. Rule count: 6 → 14. Sync surfaces per `coding-policy: context-artifacts` Surface Sync: `tile.json` rules entries added; README rules table extended.

### Rules — conciseness pass per `coding-policy: context-writing-style`

Always-on rules are loaded into every agent invocation, so meta-justification prose and dated incident references inflate the per-invocation token budget for no operational gain. This pass strips that content while preserving the operative contracts. Cut content is archived here per the rule's "What to Cut → move to CHANGELOG" guidance.

- **tessl-version-floating** — dropped `## Why the exception exists` section (mechanics of `tessl update` in-place rewrites at three call sites + the `vendored`-on-gitignored-content broken-contract diagnosis + 2× `Verified 2026-04-27` and `Verified 2026-05-03` worked examples showing the 22-day pin drift on tessl-workspace and the silent rewriting between `0.1.17`/`0.2.3` HEAD and `0.1.27`/`0.3.12` NAS for the project-root manifest). Cut the "Reproducibility is sacrificed by design — the orchestrator is a single deployment we control end-to-end, not a library distributed to third parties" justifying clause from `## Verify on every deploy`; cut "because the failure mode it prevents is silent runtime drift, and the deploy is the gate every change must pass through to actually take effect" trailing because-clause; cut the `Verified 2026-04-27 against the live tessl CLI:` prefix on the `## When tessl install writes a pin` section. The CHANGELOG entry above already records the pin-drift incident motivation.

- **orchestrator-dep-refresh** — dropped `## Why deploy.sh's default path goes stale` section (BuildKit cache-key mechanics + the `Reference incident 2026-05-02` worked example with image SHAs `b147e3b2…` / `c068384e…` showing the older cached image being re-tagged as `:latest`). The compact mechanics summary moved inline into `## When this rule fires`. Cut "but the verification step exists because the failure mode (silent stale dep) is invisible from the deploy script's exit code alone" trailing clause from `## Verify after refresh`. The CHANGELOG entry above already records the 2026-05-02 incident.

- **copilot-nudge-after-10min** — dropped `## Why` section (PR-UI mechanics + `Observed on 2026-04-20: four admin/core PRs had been summoned via GraphQL and sat idle for 2+ hours; posting @copilot review got a response within ~30 seconds on every one` worked example). The compact mechanics summary moved inline into the opening paragraph.

- **host-conventions** — trimmed the meta-prose preamble of `## No deferral, no laziness` ("You are a stateless service. There is no 'later', no 'another session', no 'next time.' Every session is the only session. When you see a problem, fix it now. When the user asks for something, do it now.") to one line. The "Forbidden patterns" bullet list — which is the operative content per `What to Cut → Anti-patterns buried in prose — bullet them instead` — is preserved verbatim.

- **orchestrator-dep-refresh** (new) — `Dockerfile.orchestrator` installs npm packages directly from GitHub repos (currently `jbaruch/reclaim-tripit-timezones-sync`). When the upstream GitHub repo ships a new version, BuildKit's cache for `RUN npm install -g <GitHub-repo>` does NOT invalidate — the cache key is the Dockerfile string, not the GitHub state — so a default `./scripts/deploy.sh` reports "deploy complete" while the orchestrator silently keeps running the prior dep version. A bare `docker compose build --no-cache --pull` followed by `up -d --build` is also unsafe: BuildKit retains multiple cache entries and can resurrect an older one for the second `--build` invocation, observed 2026-05-02 with `reclaim-tripit-timezones-sync` (a fresh `b147e3b2…` build was overwritten when the subsequent `up -d --build` re-tagged an older `c068384e…` cached image as `:latest`). The rule documents the operator-blessed refresh procedure (`./scripts/deploy.sh --no-cache`, added in `jbaruch/nanoclaw#463`), when to use it (only when an npm-from-GitHub dep version is the change being deployed — `--no-cache` rebuilds every layer from scratch and is wasted CI time otherwise), and a post-deploy verification step (`docker exec nanoclaw npm list -g | grep <package>`) since the failure mode is invisible from the deploy script's exit code alone.

- **post-merge-publish-watch** (new) — A tile-repo PR merge is not the same as a registry publish. The post-merge `Review & Publish Tile` workflow has its own gates (skill review at threshold 85 over the whole skill, lint, the publish action) and can fail after every PR-time check passed. This rule prescribes the watch loop, the failure-fix-republish cycle, and a two-check registry-version verification (repo `tile.json` bump AND workflow conclusion `success`) before declaring the original PR's task done.

- **tessl-version-floating** (new — supersedes the earlier `tessl-version-pin-drift` recipe; filename renamed) — `tessl-workspace/tessl.json` MUST use `"version": "latest"` for every tile, never a literal pin. The owner has approved this as a deliberate exception to `coding-policy: dependency-management`'s pin / lock-file requirement, documented in the rule body as the authority-of-record. Floating versions resolve at install / update time without rewriting the manifest, so the prior 22-day pin-drift bug between git and the running orchestrator (core 0.1.60 → 0.1.87, admin 0.1.101 → 0.1.230, etc.) is structurally impossible. `scripts/deploy.sh` verifies on each deploy that no literal pin has crept in (a `tessl install <tile>` invocation writes a pin by default, so the failure mode is real). Reproducibility is sacrificed by design — the orchestrator is a single deployment we control end-to-end, not a library distributed to third parties; for this one manifest the operational cost of pin drift dominates the value of pin-level reproducibility. `dependency-management` still applies everywhere else in the repo.

### Surface sync

- `tile.json` adds `entrypoint: README.md` per `jbaruch/coding-policy: context-artifacts`.
- `README.md` and `CHANGELOG.md` introduced (none existed previously). Both will be maintained going forward as required by the policy.

The README's rules-table summaries are auto-extracted first-paragraph excerpts from each rule file. Refine them per rule when the wording is misleading; this commit is a structural bootstrap, not authored prose.
