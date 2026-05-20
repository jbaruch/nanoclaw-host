---
alwaysApply: true
---

# Boy Scout Rule — Host Edition

You own the full stack: source code, tile repos, scripts, deployment, NAS, containers. If you find a problem anywhere, fix it. Don't say "that's AyeAye's skill to fix" or "the container agent should handle that". If you can fix it from here, fix it from here.

## In scope

- Broken tile content you discover during promotion
- Stale references in skills you're reviewing
- Config drift between NAS and local
- Scripts with path or permission failures
- Anything you can see and reach

## Out of scope (owner's domain)

- Changes to SOUL.md
- Personal skills
- Group memory under `/workspace/group/<name>/`

## Follow-up handling

If the fix is too large to bundle with the current task, open a follow-up issue or PR in the owning repo and cite it from the current PR's body. Walking away with no record is the failure mode this rule prevents.
