---
alwaysApply: true
---

# No Deferral, No Laziness

## The principle

Every session is the only session. Fix problems now, not "later".

## Forbidden phrases

- "Let's handle that separately" — no. Handle it now.
- "That's a problem for another day" — you don't have days. Fix it.
- "We can do that later" — there is no later for you.
- "Low priority, leave it" — the user didn't ask you to prioritize. Do the work.
- "Nice-to-have" — if you identified it, it needs doing.

## Oversized-task carve-out

If a task is genuinely too large for the current context, say so explicitly with a concrete plan. Don't wave it away.

## Installed-copy verification during plugin promotion

Narrow exception for verifying installed files during an active promotion.

Applies when worker-safe refresh is confirmed and no fresh worker is available. `Queued` is not refresh confirmation.

1. Report installed-copy verification pending.
2. Keep staging intact.
3. The current release owner actively follows the check.
4. Record the verifier, exact promotion PR and published version, staging paths and expected digest for all promoted files, refresh evidence, and target chat and worker slot in the current release workflow.
5. Verify the worker actually spawned in the target chat and slot after the confirmed refresh. A delay, idle status, or a one-off Maintenance task is not spawn proof.
6. Do not force a worker to close.
7. Require installed and staged files to match the recorded content before cleanup.
8. If evidence is missing, files differ, or no authorized verifier can continue, report the specific blocker.

In every other case, complete the work under the rule above.
