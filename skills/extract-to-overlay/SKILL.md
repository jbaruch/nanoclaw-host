---
name: extract-to-overlay
description: Sequential workflow for migrating an admin-tile skill, rule, or script set into a per-chat overlay tile. Audits cadence frontmatter, state-plane couplings, and cross-skill imports; moves files across two tile repos; updates per-group additionalTiles config; ships each side through publish-tile; verifies live materialisation. Use when extracting an admin skill to an overlay, refactoring admin content into per-chat tiles, splitting capabilities out of nanoclaw-admin, or wiring additionalTiles for a freshly extracted overlay.
---

# Extract to Overlay

Process steps in order. Do not skip ahead.

Migrates one admin skill, rule, or script set from `jbaruch/nanoclaw-admin` to a per-chat overlay tile (existing in the registry) under the `containerConfig.additionalTiles` schema from `jbaruch/nanoclaw#305`. Authoring contract in `rules/overlay-tile-authoring.md`.

Out of scope: scaffolding a brand-new overlay tile repo from zero.

## Step 1 — Identify migration candidate and target

Confirm with the operator:
- Source path in `jbaruch/nanoclaw-admin` (e.g. `skills/morning-brief/` or `rules/foo.md`)
- Target overlay tile name (existing tile in the registry)
- Affected chat group JIDs whose `containerConfig.additionalTiles` will be updated

Record as `SOURCE_TILE`, `SOURCE_PATH`, `TARGET_TILE`, `TARGET_PATH`.

If the target tile does not exist in the registry, halt and surface "target tile must be created first".

Proceed immediately to Step 2.

## Step 2 — Audit migration plan

Audit fires conditionally on artifact type. Skills get cadence + state-plane + import checks. Rules get scope + link checks. Run the applicable section, then proceed.

**Skill artifact — cadence axis** — read `<SOURCE_PATH>/SKILL.md` frontmatter:
- `cadence:` present? `script:` present? Both required for cadence-driven; both absent for user-driven-only
- Mismatch (one present, other absent) blocks the migration — fix in source before extracting
- Two cadence claims (docstring + frontmatter, or two scripts sharing one SKILL.md) signal a split candidate — extract as two separate skills

**Skill artifact — state-plane couplings** — grep `<SOURCE_PATH>` for `/workspace/state/` and `/workspace/group/`:
- For every `/workspace/state/<other-skill>/` read: confirm the writer skill survives in a tile loaded for the affected chats
- For every `/workspace/state/<self>/` write: list readers across all tiles via `rg "/workspace/state/<self>/" .tessl/tiles/`
- Schema-version sources: confirm `schema_version` field present per `coding-policy: stateful-artifacts`

If any read points at a writer that won't be loaded for the affected chats, halt — `rules/overlay-tile-authoring.md` reader-without-writer clause forbids shipping.

**Skill artifact — cross-skill imports** — grep `<SOURCE_PATH>` for `import` statements referencing sibling skills:
- Same-tile sibling imports survive when the sibling moves with the skill
- Cross-tile sibling imports require subprocess composition per `rules/overlay-tile-authoring.md`
- Capture the import contract for the move

**Rule artifact — scope and links** — read frontmatter and body of `<SOURCE_PATH>`:
- If `applyTo:` is path-scoped, confirm the matched paths exist in the target tile or in a tile co-loaded with it; an orphaned scope makes the rule fire on nothing
- For every `[[<name>]]` link in the body, confirm the linked rule lives in the target tile or in a tile co-loaded with it; orphaned links become broken cross-references on every consumer

Proceed immediately to Step 3.

## Step 3 — Move artifacts

Worktree-isolate per `coding-policy: agent-worktree-isolation`. Two worktrees — one per tile repo.

In the source worktree (`jbaruch/nanoclaw-admin`):
- `git rm` the skill directory (or rule file, or script set), preserving any sibling skills the audit did not include in the migration
- Update `tile.json` — remove the entry under `skills:` (or `rules:`)
- Update `README.md` table — remove the row
- Add `CHANGELOG.md` entry under Unreleased — `Removed: <name> migrated to <TARGET_TILE>`

In the target worktree (`jbaruch/<TARGET_TILE>`):
- Copy the artifacts preserving relative paths inside the new tile
- Update `tile.json` — add the entry
- Update `README.md` table — add the row
- Add `CHANGELOG.md` entry under Unreleased — `Added: <name> migrated from nanoclaw-admin`

Proceed immediately to Step 4.

## Step 4 — Update per-group additionalTiles

For each affected chat group JID:
- Read current `containerConfig.additionalTiles` from `messages.db` on the NAS
- Add bare tile name `<TARGET_TILE>` to the list if absent — bare name only (`nanoclaw-flight-assist`), never workspace-qualified (`jbaruch/nanoclaw-flight-assist`). The workspace-qualified form trips the spawn validator and the circuit breaker
- Write via `update_group_config` IPC — write-time validator rejects non-existent tiles per `jbaruch/nanoclaw#305`

If the target tile is not yet published, defer this step until Step 5 completes the target-tile publish.

Proceed immediately to Step 5.

## Step 5 — Ship both tiles

Order: target tile first (publishes the destination), then source tile (removes the now-orphaned admin entry).

Invoke `Skill(skill: "release")` once per tile worktree. Each invocation runs the full PR lifecycle for its tile: PR creation, dual-lens automated review (gh-aw + Copilot), review iteration, merge, post-merge publish-tile watch per `rules/post-merge-publish-watch.md`.

Do NOT invoke `Skill(skill: "ship-code")` here — `ship-code` is scoped to the `jbaruch/nanoclaw` private→public fork chain per `rules/repo-chain.md`, not tile-repo lifecycles.

Wait for both `Review & Publish Tile` runs to land green AND for the registry to advance past the prior versions of both tiles. Only registry version advance counts as shipped.

Proceed immediately to Step 6.

## Step 6 — Post-deploy live verification

Deploy on the NAS:

```bash
ssh nas "cd ~/nanoclaw && ./scripts/deploy.sh"
```

Probes fire conditionally on artifact type.

**Skill artifact** — three probes per `rules/overlay-tile-authoring.md`, all required:
- Target row materialises: `SELECT * FROM scheduled_tasks WHERE id LIKE 'cadence-registry::%::tessl__<skill-name>'` returns at least one row
- Source row is gone: same query against the pre-migration skill name returns zero rows
- Live handshake against every external MCP or API surface in the moved skill's data plane

**Rule artifact** — manifest integrity is enforced by `tessl tile lint` at publish in Step 5; no further probe. Agents load the rule on next session start.

If any probe fails, fix in a follow-up PR on the appropriate tile and re-verify. Do not declare done until all applicable probes pass.

Finish here.
