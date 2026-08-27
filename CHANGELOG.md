# Changelog

## 0.1.63 — 2026-08-27

### Drop `nanoclaw-orders` from the plugin-repo set

The overlay is retired (`jbaruch/nanoclaw#935` dropped its `orders` / `orders_metadata` tables, `jbaruch/nanoclaw-admin#519` removed every reader) and its repo is archived. The plugin-repo set is an authority-of-record list of manifests the `check-tessl-latest.sh` `SessionStart` hook is expected to police; naming an archived repo there points the hook's contract at a manifest nobody edits any more.

The other eight entries are unchanged, as are both requirements. README's rules-table row said the hook enforces "the nine plugin repos" and now says eight — `context-artifacts`' Post-Edit Rule Audit asks that the repo match the rule it just edited, and the count was the one place it did not.

`.cursor/` joins `.claude/` / `.agents/` / `.codex/` / `.gemini/` in `.gitignore`. It was the one Tessl consumer-side scaffolding directory missing from that list, so `git add -A` committed its generated `hooks.json` and two `.gitignore` stubs into this PR. Caught by the policy reviewer.

## 0.1.62 — 2026-08-18

### Fix — typed cross-skill references in `extract-to-overlay`

Steps 4 and 6 named the release skill in prose ("the release skill's Step 7") after 0.1.61 rewrote them to delegate the release contract. `coding-policy: skill-authoring` Typed Calls requires cross-skill references in the typed `Skill(skill: "name")` form so the dependency stays machine-recognizable; both now read `Skill(skill: "release")` Step 7, matching the typed `ship-code` reference two lines above them.

The fleet reviewer posted these findings while the 0.1.61 merge was in flight, so they land here rather than on `#51`.

`post-merge-publish-watch` also splits one bullet that carried two directives.

## 0.1.61 — 2026-08-18

### Rule — the publish watch matches the workflow file, not its display name

`post-merge-publish-watch` matched the post-merge run by display name (`--workflow 'Review & Publish Tile'`). The tile→plugin rename split that name three ways across the fleet, so the match silently found nothing on the repos that moved — `jbaruch/nanoclaw-media` reported `NO PUBLISH RUN FOUND` for a run that had already succeeded. The rule now passes the workflow FILE, `publish.yml`, which is stable across the rename; an unresolvable file argument exits non-zero rather than returning an empty list that reads as a clean pass.

Reviewing the fix surfaced the larger gap: the rule hand-rolled a watch the fleet already owns. `coding-policy: ci-safety` defines a three-conjunct release contract — run `success`, registry advance past a pre-merge baseline, moderation cleared — implemented in `coding-policy` `skills/release` Step 7. This rule verified a `tile.json` bump and a run conclusion, neither of them a conjunct, and `extract-to-overlay` Steps 4 and 6 gated tile ordering on registry advance alone. Moderation gates `tessl install`, so both surfaces could call a version shipped while it was still install-blocked. Both now delegate to the release skill and report shipped on its confirmation.

The rule keeps only its own specialization — which identifier to pass — and is directives throughout. `.github/hooks/` joins the ignore list as tessl-generated scaffolding. This repo's `publish.yml` keeps the `Review & Publish Tile` display name in this change; 0.1.60 held that rename pending exactly this rule, and it is now unblocked rather than done — the rename itself belongs to the vocabulary sweep in `#53`.

Fixes #50. Full incident detail, the fleet-wide name/file survey, and the review history are in the PR.

## 0.1.60 — 2026-08-18

### Chore — migrate from `tile.json` to `.tessl-plugin/plugin.json` (`jbaruch/nanoclaw-core#97`)

Ran `Skill(skill: "tessl__migrate-to-plugin")`: `tessl plugin migrate` wrote `.tessl-plugin/plugin.json` at the current version (0.1.59, published from `main` while this branch was in review), `.tileignore` became `.tesslignore`, and `tile.json` is gone. The exclusion set moves across unchanged — `skills/**/tests/` and an anchored `/tessl.json` — so package contents do not move. Verified against the packed archive: `register-ugos-project.sh` ships, its `tests/` sibling does not, `tessl.json` is out. All 20 rules keep their `alwaysApply` frontmatter in the rule files themselves, which is where `jbaruch/coding-policy: rule-frontmatter` puts scope.

Only the unambiguous renames ride along: the plugin description, and `tessl tile lint` → `tessl plugin lint` in the `promote` and `extract-to-overlay` skills. The `publish.yml` display name stays `Review & Publish Tile` here. `rules/post-merge-publish-watch.md` locates the post-merge run by exact display name, so renaming the workflow in this repo would leave the published rule hunting for a string that no longer exists — the same failure `jbaruch/nanoclaw-host#50` reports and `#51` fixes by matching the workflow file instead. The rename lands once that rule stops depending on the name.

The rest of this repo's "tile" vocabulary is deferred to `jbaruch/nanoclaw-host#53`. Three reasons, and none of them is a find-and-replace: `rules/overlay-tile-authoring.md` and `rules/tile-content-pipeline.md` are published rule identifiers other repos cite by name; `rules/post-merge-publish-watch.md` is owned by in-flight `#51`; and much of the remainder is live contract rather than prose — `containerConfig.additionalTiles`, `TILE_NAME=`, `reconcile-tiles.sh`, `staging/{tileName}/` NAS paths. Issue #53 carries the full keep-list and the per-file scope.

## 0.1.59 — 2026-08-18

### Rule — the floating requirement covers `jbaruch/*`, not every dependency

`tessl-version-floating` opened by requiring every `dependencies.<tile>.version` in every NanoClaw `tessl.json` to be `"latest"`. `jbaruch/coding-policy` `dependency-management` says the narrower thing: its Runtime-Managed Manifest Carve-Out floats `jbaruch/*`, and third-party dependencies "pin normally and stay out of scope." Nine `nanoclaw*` repos ship a committed manifest pinning `finsi/codex-review@0.1.2` with every `jbaruch/*` dep floating, and the policy reviewer blocked eight companion PRs until that pin went back in. The pin is the enforced behaviour; this rule's text was the outlier, and Copilot said so on #48 against `tessl.json:7`.

The rule now scopes the floating requirement to `jbaruch/*` and names two covered sets rather than one, because they genuinely differ.

**Why `jbaruch/nanoclaw`'s two manifests still float everything.** Not grandfathering — `tessl update` does not honour a pin. It rewrites the specifier in place: a manifest pinned to `0.1.57` came back `0.1.58`, resolved state and all. Three unattended callers run it against `tessl-workspace/tessl.json` and the project-root `tessl.json` — `scripts/deploy.sh`, the orchestrator's 15-minute catch-up loop, the `tessl_update` MCP tool — none on a tree anyone reviews. A pin there is rewritten on the NAS with no commit behind it, and the next `git pull` reverts the rewrite and rolls the deployment backward against the registry. `deploy.sh` step 3b already asserts exactly this for exactly these two files, so it needs no reconciliation; the rule's wording was what had drifted away from the gate, not the other way round.

**What checks the other nine.** `deploy.sh` runs in `jbaruch/nanoclaw`'s tree and never sees those repos, which is why the divergence went unnoticed. The check is `hooks/check-tessl-latest.sh`, the `SessionStart` hook `coding-policy` ships, which flags any `jbaruch/*` dependency not at `latest` — the carve-out explicitly accepts a plugin-shipped session hook in place of a deploy gate. That makes the hook load-bearing rather than incidental, so the rule now requires every repo in the set to declare `jbaruch/coding-policy` as a dependency.

`nanoclaw-host` was the one repo in its own covered set that did not. Eight of the nine install `coding-policy`; this one authored the rules citing it as authority and installed neither the policy nor its hook, so its manifest had no deterministic check at all — the same shape as the gitignored-manifest gap 0.1.58 closed, one level up. It is now a dependency, floating at `latest`, and the hook resolves against this manifest. `tessl install` wrote `0.3.162` on the way in, which is the pin the rule's own closing section says to float before committing.

**A third-party pin does not hold itself.** The `tessl update --yes` that hook runs every session rewrites third-party pins too, the moment upstream publishes past them. `finsi/codex-review@0.1.2` has held only because `0.1.2` is still latest.

That makes the renewal automatic, which changes which half of Freshness applies. Freshness asks every pin for a renewal *mechanism*, and asks for a documented *cadence* only where no automated mechanism tracks it. README used to promise a quarterly `tessl outdated` sweep — a cadence for a pin that already had a mechanism, and one describing a chore the tooling performs unattended. Both surfaces now state the mechanism instead: the tooling bumps the pin and leaves the manifest diff in the working tree, and reviewing that diff is the renewal. Land it as its own commit rather than letting it ride along on whatever branch is open.

The rule and README carry directives only. The mechanical reasoning the reviewer moved off those surfaces — why a glob would void the carve-out, why the unattended manifests cannot hold a pin, why the session hook is load-bearing rather than incidental — is above, per `coding-policy: context-writing-style`.

`.github/hooks/` joins the ignore list. `tessl install` generates it, it points into the gitignored `.tessl/` tree, and it belongs with `.github/skills/` and `.github/mcp.json` rather than in the tree as a permanently-untracked file.

Out of scope, per the issue: the nine merged manifest PRs. They match `coding-policy` as installed. This is the rule text catching up to them.

## 0.1.58 — 2026-08-18

### Chore — commit `tessl.json` as the dependency manifest it is

`.gitignore` excluded `tessl.json`, so the repo carried no committed declaration of what it depends on, and `hooks/check-tessl-latest.sh` in `jbaruch/coding-policy` — the deterministic enforcement for the Runtime-Managed Manifest Carve-Out — took its "no manifest, not a consumer" silent no-op path every session. With nothing watching, the untracked local manifest drifted to `"mode": "vendored"` with literal version pins.

The manifest is now committed and `"mode": "managed"`. Every `jbaruch/*` dependency floats at `latest` under the carve-out; `finsi/codex-review` is third-party and stays pinned, with its renewal cadence recorded in `README.md`. The ignore file keeps the manifest out of the published package.

## 0.1.56 — 2026-08-16

### Rule — `jq` joins the agent image's recorded package set

`jbaruch/nanoclaw-travel#270` overlays the `jbaruch/tripit-api` tile onto the travel chat, and its `using-tripit` scripts parse every response with `jq`. Their shared `tripit_require` asserts `curl` and `jq` before any request, so on an image without it the skill fails at the first step rather than degrading — the agent gets a missing-tool error, not travel data.

The agent image had `curl` and not `jq`. Adding it grows the covered set, which is exactly what this rule bounds, so the two mirrors move together: `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/deploy.sh` (authoritative, deploy-gated) and the list here (human-readable). `jbaruch/nanoclaw#925` carries the Dockerfile and the gate.

## 0.1.55 — 2026-08-03

### Rule — OS package floating carve-out (2026-08-02)

New `os-package-floating` rule, the authority-of-record for the unversioned `apt-get install` lists in all three of `jbaruch/nanoclaw`'s container images, under the OS-Package Runtime Carve-Out added in `coding-policy` #252.

The fleet reviewer raised it on `jbaruch/nanoclaw` #896, which had documented `ffmpeg` as deliberately unversioned while claiming an exception the policy did not define. Pinning it would have been worse than the gap: Debian's archive serves only the current version of a package, so `ffmpeg=<version>` resolves until the next security update supersedes it and then fails every build of that image. The pin schedules an outage rather than freezing behaviour.

Scope deliberately covers all three images rather than only the sidecar that triggered it. The agent image installs 22 unversioned packages and the orchestrator 7 — same shape, same reasoning — and a rule naming only `ffmpeg` would have left the larger surface undocumented while looking complete.

CHANGELOG stamping is switched on in the same change, because the reviewer's remedy for the forbidden `## Unreleased` bucket only works with it: the reusable publish workflow has always carried a stamp step, and this repo's caller never passed `stamp-changelog: true`, so un-headed entries would have stayed un-headed forever. The two entries whose versions the registry confirms are stamped directly (`0.1.54` published 2026-07-28, `0.1.53` on 2026-07-27); everything older is grouped under `## 0.1.52 and earlier` rather than left sitting under a heading it does not belong to. Those older entries keep their own dates and are not retro-mapped — that would take per-entry archaeology this change does not attempt.

Published as `coding-policy` 0.3.131, not 0.3.130 — an unrelated `response-clarity` change took that number while this sat, and the rule's citation was corrected to match rather than left pointing at the wrong release.

The gate earned its keep before it shipped: the first run against the real tree flagged `gh` in `Dockerfile.orchestrator`, which a hand-read of the apt blocks had missed because that image installs it in a second `apt-get install` after adding GitHub's repo. A prose-only rule would have carried that omission indefinitely.

What keeps it bounded is the pair of conditions the carve-out demands. The base image must stay pinned, because the distro release is what makes "current in trixie" a bounded range; a base moved to `:latest` voids the exemption for that image. And `deploy.sh` step 3b-quater fails on an unpinned base or on any package outside the recorded set, so adding one is a reviewed edit to `COVERED_IMAGES` rather than a silent one-line growth.

## 0.1.54 — 2026-07-28

### Rule — sync CLI floating carve-out

New `sync-cli-floating` rule. `jbaruch/nanoclaw`'s agent image installs `jbaruch/reclaim-tripit-timezones-sync`, which was pinned to a tag per `coding-policy: dependency-management` Pinning. The package gained OneCLI gateway support on 2026-07-10 — the support that container needs, since the `GOOGLE_*` OAuth trio left it in the #638 native-Google migration — and no tag was cut for those commits. Renovate's github-tags manager had nothing newer to propose, so the pin read as current while the deployed CLI created zero OOO blocks for 19 days.

Both repos are the same operator's, and the package's only consumer is that Dockerfile, so the pin was not standing between the consumer and unreviewed upstream change. It was holding the consumer on a build that predated a fix written for it. This rule is the authority-of-record for unpinning it, under the First-Party Co-Shipped Dependency Carve-Out added in `coding-policy` #250.

The deploy gate runs in `scripts/deploy.sh` rather than only in CI because the gate exists to keep a pin off the NAS, and a deploy can be driven from a working tree CI never saw — rationale that lives here rather than in the rule body.

The pin's failure mode is what makes this worth a rule rather than a commit message: the package gained OneCLI support on 2026-07-10 with no tag cut, Renovate's github-tags manager had nothing to propose, and the agent image kept a build that created zero OOO blocks for 19 days while the timezone half of the same sync kept working normally. Nothing was red. That incident detail lives here rather than in the rule body per `coding-policy: context-writing-style`.

The rule carries two enforcement obligations rather than one. The familiar one is the deploy gate: `verify_sync_cli_floating` in `scripts/deploy.sh` fails on any `#<ref>` specifier, mirroring the `snitchmd-image-floating` and `tessl-version-floating` gates. The second is specific to a Docker-layer dependency — the `ADD` of the upstream commit JSON above the `RUN`, without which BuildKit serves the cached layer forever and "unpinned" quietly means "whatever the last rebuild fetched". A floating reference behind a layer cache is a pin nobody can read, so the gate checks for the trigger too, not just the absence of a specifier.

## 0.1.53 — 2026-07-27

### Rule — snitchmd image floating carve-out

New `snitchmd-image-floating` rule. `jbaruch/nanoclaw`'s `fetch_markdown` handler has always defaulted its sidecar image to the floating tag `syabro/snitchmd:latest`, with the reasoning sitting in a code comment beside the constant — which is not where `coding-policy: dependency-management` looks. The fleet policy reviewer flagged it on `jbaruch/nanoclaw` PR #883 (the #879 ops.ts split, which relocated the line verbatim) and correctly declined a follow-up ticket as a resolution: the rule's carve-out requires an authority-of-record rule plus deploy-time enforcement, not a promise.

This rule is that authority-of-record. It names the covered path, states why this particular dependency floats (snitchmd's value is adversarial freshness — each release carries updated CloakBrowser fingerprints, so a pin degrades toward blocked fetches as anti-bot detection advances, and a pin's renewal cadence competes with an adversary's release cadence), and requires `scripts/deploy.sh` to fail the deploy on any non-floating committed default. `SNITCHMD_IMAGE` remains the per-box escape hatch and is explicitly out of the gate's scope: environment configuration is not a committed dependency.

Enforcement lands in `jbaruch/nanoclaw` #883 as `verify_snitchmd_image_floating`, mirroring the existing `mode: managed` + `version: latest` manifest gate that `tessl-version-floating` owns.

## 0.1.52 and earlier

Entries below predate CHANGELOG stamping in this repo; each carries its own date, and mapping them to published versions would take per-entry archaeology this change does not attempt.

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
