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

For an in-progress promotion on the worker-safe NanoClaw refresh path, only the installed-copy check may remain pending, and only when the host refresh is confirmed but no fresh worker is available. A `Queued` reply is not refresh confirmation. Keep staging untouched and report **installed-copy verification pending**, not complete.

The current release owner stays accountable and actively follows the check. In the existing release workflow, durably record who is verifying, the exact promotion PR and published plugin version, the staging paths and expected content digest covering all promoted files, the refresh evidence, and the target chat and worker slot. If no authorized verifier can continue observation, tell the release owner the check is blocked and leave staging untouched.

Before cleaning up any staging copy, record evidence that the worker in the target chat and slot actually spawned after the confirmed refresh and that its installed files and the retained staging copy both match the recorded content. An elapsed delay, an idle or `not-spawned` status alone, or a one-off scheduled task in Maintenance is not spawn proof. Never use `nuke` or otherwise force a worker to close for verification. If the evidence is missing or the content differs, keep staging and report what is unverified.
