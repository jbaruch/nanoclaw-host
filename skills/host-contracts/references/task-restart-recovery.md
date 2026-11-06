# Task Restart Recovery

## Owner and schema

- Artifact: `task_restart_recoveries` in `/workspace/store/messages.db`.
- Owner: `jbaruch/nanoclaw` scheduler through `src/db-task-occurrences.ts`.
- Schema of record: `src/state-migrations/state-026-task-restart-recoveries.ts`.
- Every record carries integer `schema_version` 1.
- Key: `(task_id, scheduled_for, attempt)`; attempt is the occurrence's attempt number before retry.
- Required fields: `group_folder`, `started_at`, `interrupted_at`.
- All timestamps are canonical UTC ISO with exactly milliseconds and `Z`.
- An interval means the host lost an attempt's terminal result. A detached worker may remain alive; it is never evidence of successful delivery or actual worker termination.

## Writer

- Snapshot supported running occurrences before retry can replace their start timestamps.
- Insert intervals and mark those occurrences `unknown` in one transaction.
- Do not modify completed occurrences or unsupported occurrence versions.
- Reject noncanonical, invalid or future start times as unusable intervals; emit a recovery diagnostic and mark the occurrence unknown without inventing a time window.
- A persistence failure rolls back the whole operation and prevents dispatch until startup can retry. Ordinary delivery telemetry remains best-effort.
- Preserve intervals while their task exists; task deletion removes its intervals through the foreign key.
- Only the owner writes or migrates the table. Container readers never mutate it.

## Email reader

- `jbaruch/nanoclaw-admin` `skills/email-surface/scripts/email_surface_retry.py` reads supported intervals through its precheck.
- Accept only version 1, the exact task/group identity, canonical ordered timestamps, and positive integer attempts.
- Use the interval only with the email owner's durable emission receipt and an exact matching live seen row; preserve foreign and subsequently refreshed claims.
- A later successful or skipped retry does not hide an unresolved restart interval.
- Unknown record versions are unusable; skip them with an actionable diagnostic. Do not migrate or downgrade them.
- A missing table during rollout is normal and retains the existing failed-run-log recovery path. No wake-always, global deletion or alert storm fallback.
- A malformed supported row or query failure reports recovery uncertainty and releases no claims from that row.
- Repeating recovery is safe: an emission inserted after the old interval cannot match that interval's ownership proof.

## Rollout and verification

### Morning-brief lock reader

- `jbaruch/nanoclaw-admin` `skills/morning-brief/scripts/acquire-pending-lock.py` may read version-1 intervals to reclaim its own pending lock in the existing `BEGIN IMMEDIATE` transaction.
- Resolve the canonical `cadence-registry::<group_folder>::tessl__morning-brief` task from `scheduled_tasks` with `source = 'cadence-registry'` and the host-supplied `NANOCLAW_CHAT_JID`. Require the interval's task and group to match.
- Accept only canonical ordered timestamps, positive integer attempts, and `started_at <= pending_run_at <= interrupted_at <= now`.
- Check the brief's delivery marker and confirmed-date cursor before reclaiming. An already delivered or confirmed brief remains complete.
- A matching interval permits replacing the pending lock; it proves no worker termination, delivery, or exact lock-owner identity. The existing pending lock records only a timestamp. A surviving worker may finish late; this recovery policy accepts that duplicate risk.
- The scheduler defers recovery while an adopted maintenance worker owns the group slot (`src/task-scheduler.ts`, `startSchedulerLoop`). Do not bypass that host admission.
- A missing table retains ordinary stale-lock behavior. Unsupported versions, malformed rows, missing canonical identity and read failures emit actionable diagnostics and supply no takeover condition.
- The skill alone writes its own `follow_me_tasks` cursors; it never writes or migrates restart intervals. Publish/install this reader authority before the consumer.
- Verify matching intervals, interval boundaries, fresh locks outside the interval, foreign task/group records, malformed/unsupported records and the already-delivered guard with fixed-clock SQLite fixtures.

### Email reader rollout

- Publish/install this authority first.
- Publish and deploy the email reader that accepts both the pre-table host and version-1 interval records.
- Deploy the host migration/writer after that reader is present.
- Verify restart-to-retry recovery, exact millisecond boundaries, unsupported versions, foreign/successful claims, and atomic failure before dispatch with deterministic fixtures.
- This contract does not authorize full worker reattachment, external replies, or an automatic resend of an already delivered message.
