---
alwaysApply: true
---

# Scheduled Task Model and Pre-Gate

## Task Declarations

- Apply when creating or reviewing scheduled tasks, including cadence skills, `scheduled_tasks` rows and one-shots.
- Require an explicit, non-empty model for every task; never rely on the tier's default model.
- Cadence `SKILL.md` frontmatter declares `agentModel` and a skill-relative precheck `script` alongside `cadence`.
- Scheduling requests and `scheduled_tasks` rows declare `agent_model` and a precheck `script`.

## Wake Decision

- Run the precheck script before waking Claude.
- Use deterministic checks to decide whether work is due.
- Consult Jev wherever the wake decision needs judgment.
- Return the existing `{wake_agent, data}` JSON contract; wake Claude only when the gate finds work.
- An unconditional wake does not qualify as a pre-gate.

## Policy Review

- Flag a task missing either the explicit model or the precheck as a blocking policy violation, including PRs adding cadence skills.
- Do not merge or insert a task until both requirements are met.
- Verify the declared script exists and implements the wake decision before approving the task.
- Authority: [owner decision, 2026-11-12](https://github.com/jbaruch/nanoclaw/issues/1367); [fleet backfill](https://github.com/jbaruch/nanoclaw/issues/1374).
