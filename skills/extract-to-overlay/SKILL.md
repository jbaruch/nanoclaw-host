---
name: extract-to-overlay
description: Sequential workflow for migrating an admin-plugin skill, rule, or script set into a per-chat overlay plugin. Audits cadence frontmatter, state-plane couplings, and cross-skill imports; moves files across two plugin repos; updates per-group additionalTiles config; ships each side through the publish pipeline; verifies live materialisation. Use when extracting an admin skill to an overlay, refactoring admin content into per-chat plugins, splitting capabilities out of nanoclaw-admin, or wiring additionalTiles for a freshly extracted overlay.
---

# Extract to Overlay

Process steps in order. Do not skip ahead.

Migrates one admin skill, rule, or script set from `jbaruch/nanoclaw-admin` to a per-chat overlay plugin (existing in the registry) under the `containerConfig.additionalTiles` schema from `jbaruch/nanoclaw#305`. Authoring contract in `rules/overlay-tile-authoring.md`.

Out of scope: scaffolding a brand-new overlay plugin repo from zero.

## Step 1 — Identify migration candidate and target

Confirm with the operator:
- Source path in `jbaruch/nanoclaw-admin` (e.g. `skills/morning-brief/` or `rules/foo.md`)
- Target overlay plugin name (existing plugin in the registry)
- Affected chat group JIDs whose `containerConfig.additionalTiles` will be updated

Record as `SOURCE_TILE`, `SOURCE_PATH`, `TARGET_TILE`, `TARGET_PATH`.

If the target plugin does not exist in the registry, halt and surface "target plugin must be created first".

Proceed immediately to Step 2.

## Step 2 — Audit migration plan

Audit fires conditionally on artifact type. Skills get cadence + state-plane + import checks. Rules get scope + link checks. Run the applicable section, then proceed.

**Skill artifact — cadence axis** — read `<SOURCE_PATH>/SKILL.md` frontmatter:
- `cadence:` present? `script:` present? Both required for cadence-driven; both absent for user-driven-only
- Mismatch (one present, other absent) blocks the migration — fix in source before extracting
- Two cadence claims (docstring + frontmatter, or two scripts sharing one SKILL.md) signal a split candidate — extract as two separate skills

**Skill artifact — state-plane couplings** — grep `<SOURCE_PATH>` for `/workspace/state/` and `/workspace/group/`:
- For every `/workspace/state/<other-skill>/` read: confirm the writer skill survives in a plugin loaded for the affected chats
- For every `/workspace/state/<self>/` write: list readers across all installed plugins via `rg "/workspace/state/<self>/" .tessl/plugins/`
- Schema-version sources: confirm `schema_version` field present per `coding-policy: stateful-artifacts`

If any read points at a writer that won't be loaded for the affected chats, halt — `rules/overlay-tile-authoring.md` reader-without-writer clause forbids shipping.

**Skill artifact — cross-skill imports** — grep `<SOURCE_PATH>` for `import` statements referencing sibling skills:
- Same-plugin sibling imports survive when the sibling moves with the skill
- Cross-plugin sibling imports require subprocess composition per `rules/overlay-tile-authoring.md`
- Capture the import contract for the move

**Rule artifact — scope and links** — read frontmatter and body of `<SOURCE_PATH>`:
- If `applyTo:` is path-scoped, confirm the matched paths exist in the target plugin or in a plugin co-loaded with it; an orphaned scope makes the rule fire on nothing
- For every `[[<name>]]` link in the body, confirm the linked rule lives in the target plugin or in a plugin co-loaded with it; orphaned links become broken cross-references on every consumer

Proceed immediately to Step 3.

## Step 3 — Move artifacts

Worktree-isolate per `coding-policy: agent-worktree-isolation`. Two worktrees — one per plugin repo.

In the source worktree (`jbaruch/nanoclaw-admin`):
- `git rm` the skill directory (or rule file, or script set), preserving any sibling skills the audit did not include in the migration
- Update `.tessl-plugin/plugin.json` — remove the entry under `skills:` (or `rules:`)
- Update `README.md` table — remove the row
- Add a `CHANGELOG.md` entry — `Removed: <name> migrated to <TARGET_TILE>`. Never under an `## Unreleased` heading, which `coding-policy: context-artifacts` forbids; follow the repo's CHANGELOG Hygiene shape for whether the version heading is stamped or hand-written

In the target worktree (`jbaruch/<TARGET_TILE>`):
- Copy the artifacts preserving relative paths inside the new plugin
- Update `.tessl-plugin/plugin.json` — add the entry
- Update `README.md` table — add the row
- Add a `CHANGELOG.md` entry — `Added: <name> migrated from nanoclaw-admin`. Same no-`## Unreleased` constraint as the source side

Proceed immediately to Step 4.

## Step 4 — Ship target plugin

Worktree-isolate the target plugin's worktree if not already done in Step 3. Invoke `Skill(skill: "release")` once for the target plugin. The release skill runs the full PR lifecycle: PR creation, dual-lens automated review (gh-aw + Copilot), review iteration, merge, post-merge publish-plugin watch per `rules/post-merge-publish-watch.md`.

Do NOT invoke `Skill(skill: "ship-code")` here — `ship-code` is scoped to the `jbaruch/nanoclaw` private→public fork chain per `rules/repo-chain.md`, not plugin-repo lifecycles.

The target plugin is shipped when `Skill(skill: "release")` Step 7 reports the release confirmed — not on a green run, and not on a registry advance. Step 5's `update_group_config` validator requires the confirmed version. The source plugin MUST NOT ship before the target: Step 6 is gated on this ordering.

Proceed immediately to Step 5.

## Step 5 — Update per-group additionalTiles

The target plugin is now in the registry, so the `update_group_config` write-time validator will accept `<TARGET_TILE>` as a valid additionalTiles entry per `jbaruch/nanoclaw#305`. For each affected chat group JID:

- Read current `containerConfig.additionalTiles` from `messages.db` on the NAS
- Add bare plugin name `<TARGET_TILE>` to the list if absent — bare name only (`nanoclaw-flight-assist`), never workspace-qualified (`jbaruch/nanoclaw-flight-assist`). The workspace-qualified form trips the spawn validator and the circuit breaker
- Write via `update_group_config` IPC

Without this step the source plugin removal in Step 6 strands the affected chats — the skill is gone from `nanoclaw-admin` but the target plugin isn't loaded for those chats yet. Order matters.

Proceed immediately to Step 6.

## Step 6 — Ship source plugin

Invoke `Skill(skill: "release")` once for the source plugin (`jbaruch/nanoclaw-admin`). Same release lifecycle as Step 4. This PR removes the migrated entry from `.tessl-plugin/plugin.json`, the README table, and adds the CHANGELOG entry recording the migration.

The source plugin is shipped on the same signal — `Skill(skill: "release")` Step 7 reporting the release confirmed. Do not proceed to Step 7 of this skill before then.

Proceed immediately to Step 7.

## Step 7 — Post-deploy live verification

Deploy on the NAS:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh"
```

Probes fire conditionally on artifact type and cadence presence per `rules/overlay-tile-authoring.md`.

**Cadence-declared skill artifact** — three probes, all required:
- Target row materialises: `SELECT * FROM scheduled_tasks WHERE id LIKE 'cadence-registry::%::tessl__<skill-name>'` returns at least one row
- Source row is gone: same query against the pre-migration skill name returns zero rows
- Live handshake against every external MCP or API surface in the moved skill's data plane

**User-driven skill artifact** (no `cadence:`/`script:` frontmatter) — no `scheduled_tasks` row exists for this skill class. Manifest integrity is enforced by `tessl plugin lint` at publish in Steps 4 and 6. Verify by triggering the skill from the affected chat with its declared user intent and confirming it loads from the target plugin, not the source plugin.

**Rule artifact** — manifest integrity is enforced by `tessl plugin lint` at publish in Steps 4 and 6; no further probe. Agents load the rule on next session start.

If any probe fails, fix in a follow-up PR on the appropriate plugin and re-verify. Do not declare done until all applicable probes pass.

Finish here.
