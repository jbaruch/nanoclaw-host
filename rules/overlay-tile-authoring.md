---
alwaysApply: true
---

# Overlay Tile Authoring

Per-chat overlay tiles layer on the trust-tier baseline via `containerConfig.additionalTiles` (see `jbaruch/nanoclaw#305`). Authoring contract for overlay skills, scripts, and rules.

## Cadence frontmatter is mandatory

- Cadence-driven skills declare `cadence:` + `script:` in `SKILL.md` frontmatter
- Both fields required — partial declaration silently produces no `scheduled_tasks` row
- Validator surface lives in `src/cadence-registry.ts`
- One-shot overlays without recurring work omit both fields

## One cadence per SKILL.md

- Each `SKILL.md` materialises exactly one `scheduled_tasks` row from the registry
- Second cadence axis = second skill directory
- A docstring claim of "runs daily at 04:00" without a frontmatter entry does NOT qualify as scheduled

## Reader-without-writer is a release blocker

- A skill that reads `/workspace/state/<other-skill>/<file>.json` cannot ship before the writer is merged in its owning repo
- Narrow exception for ladder-fallback degraded mode. Preconditions (all required):
  1. Skill explicitly falls through to a self-owned source on missing or stale reads
  2. Open issue in the writer's owning repo tracks the missing writer with a deep link from the reader skill's docstring
  3. Reader's tests cover the degraded path AND the live path
- "Out of scope: follow-up host PR" in a PR body does NOT qualify

## Live-runtime verification before shipped

- Post-deploy probe runs on the NAS: `SELECT * FROM scheduled_tasks WHERE id LIKE 'cadence-registry::%::tessl__<skill-name>'` returns at least one row per cadence-declared skill
- Live handshake against every external MCP or API surface in the skill's data plane
- Mocked unit tests do NOT substitute for live handshake
- Both gates clear before posting "shipped"

## Cross-skill subprocess composition

- Two skills in one tile that share data invoke each other via subprocess + `{wake_agent, data}` JSON contract
- Importing skill resolves the called skill at runtime via the tile mount path `/home/node/.claude/skills/tessl__<skill-name>/`, with a dev-clone fallback for unit tests
- Composition lives in the calling precheck script, not duplicated across SKILL.md prose
