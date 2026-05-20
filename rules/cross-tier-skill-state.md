---
alwaysApply: true
---

# Cross-Tier Skill State

Cross-trust-tier skills — those that may run in untrusted, trusted, AND main containers — must persist state under `/workspace/state/<skill-name>/`. Tier-pinned skills (admin-only, trusted-only) may use `/workspace/group/`.

## Mount semantics

- `/workspace/state/<skill-name>/` is RW in every container regardless of trust tier
- `/workspace/group/` is RW for trusted/main and RO for untrusted
- The mount is wired in `src/container-runner.ts` of `jbaruch/nanoclaw` (search for `'/workspace/state'`)

## Reference implementations

- `nanoclaw-core/check-unanswered/scripts/unanswered-precheck.py` reads/writes `/workspace/state/check-unanswered/`
- `nanoclaw-admin/brief-cleanup` writes `/workspace/state/brief-cleanup/`
- `nanoclaw-core/status` computes container uptime from `/.dockerenv` mtime — state persistence avoided entirely

Both patterns are valid — pick the simpler one for the skill.
