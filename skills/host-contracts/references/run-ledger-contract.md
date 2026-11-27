# Run Ledger Contract

Authority-of-record for `task_occurrences` in `/workspace/store/messages.db`, the host's scheduled-run ledger (`jbaruch/nanoclaw#1024`), under `coding-policy: stateful-artifacts`.

## Owner and schema

- Owner: the `jbaruch/nanoclaw` scheduler, through `src/db-task-occurrences.ts` and its state migrations; no container skill writes or migrates the table
- Schema of record: `src/state-migrations/state-022-task-occurrences.ts` and `state-024-task-occurrences-schema-version.ts` in `jbaruch/nanoclaw`
- One row per occurrence, keyed `(task_id, scheduled_for)`; `scheduled_for` is the task's `next_run` at dispatch
- A cadence-registry task's `task_id` is `cadence-registry::<group>::tessl__<skill>`
- Every timestamp is UTC ISO with milliseconds and `Z` (`2026-10-19T12:00:00.000Z`)
- Every record carries `schema_version` 1; a shape change bumps it in a new state migration

## Record fields

| Field | Type | Presence and meaning |
| --- | --- | --- |
| `group_folder` | TEXT | always; the task's group when the occurrence started |
| `attempts` | INTEGER | always, 1 or more |
| `started_at` | TEXT | always; the latest attempt's start |
| `progress_at` | TEXT | NULL until the run streams output |
| `ended_at` | TEXT | NULL while `running` |
| `state` | TEXT | `running`, then `completed`, `failed`, `killed` or `unknown` |
| `error` | TEXT | NULL on `running` and `completed` |
| `delivered_message_ids` | TEXT | JSON array of channel message ids; `[]` by default |
| `unverified_sends` | INTEGER | sends that returned no message id; 0 by default |

- `completed` is final; a retry restarts a `failed`, `killed` or `unknown` occurrence as `running` and counts `attempts`
- `unknown` means the host stopped before the run finished, never success

## Readers

- `jbaruch/nanoclaw-admin` heartbeat precheck: skips a missed-task recovery the ledger covers
- `jbaruch/nanoclaw-admin` system-audit: reports unverified sends
- Each reader names the versions it accepts and counts only rows of those versions
- A row of another version is no usable prior state for that reader, and the reader says so
- A missing table or column, or a query error, makes the ledger unreadable: heartbeat decides on the follow_me cursors alone and says so on stderr; system-audit records an `audit_errors` entry
- Readers are read-only and never migrate

### Calendar reminder repair

- The Admin Calendar precheck opens the native database with SQLite `mode=ro`. For each version-1 `scheduled_reminders` row, it checks for an occurrence with that row's exact `task_id`, even if the scheduled task is gone. It requires only `task_id` and `schema_version` from the ledger. A version-1 row in any state means the scheduler claimed an attempt before delivery. Delivery remains unproven. [Scheduler dispatch](https://github.com/jbaruch/nanoclaw/blob/8da4b49ec02af1bc20e410de726f64a0234fbdc7/src/task-scheduler.ts#L863-L890)
- A matching claim, a matching legacy run log (see `rules/task-run-log-reader.md`), a completed once-task, or a non-NULL `scheduled_tasks.last_run` or `last_result` excludes the reminder from task-drift repair. If any matching occurrence has a version other than 1, the precheck writes the event ID and unsupported version to stderr and holds that reminder while checking the others. Independent Calendar changes can still wake the agent. [Precheck query and diagnostic](https://github.com/jbaruch/nanoclaw-admin/blob/c30dabf91f9e5e1897132adb3764d2c855a9a714/skills/check-calendar/scripts/check-calendar-precheck.py#L128-L160)
- Missing required schema or a failed read must leave repair unavailable. On a SQLite error the precheck reports the cause on stderr and exits 1 with no wake payload. **Known gap at Admin `c30dabf9`.** SQLite can resolve the query's unqualified `schema_version` or `task_id` against the outer reminder if the occurrence table lacks that column. Before migration 024, a matching claim is silently held as version 1. With either column missing, an empty table can let drift request repair. A missing `task_id` can also let an unrelated row suppress repair. [Reader SQL and error path](https://github.com/jbaruch/nanoclaw-admin/blob/c30dabf91f9e5e1897132adb3764d2c855a9a714/skills/check-calendar/scripts/check-calendar-precheck.py#L135-L197)
- The precheck selects candidates only. The host rechecks dispatch history for the recorded, current stable and previous stable task IDs inside the per-event write transaction, so a claim made after the precheck can still block rearming. [Host history query](https://github.com/jbaruch/nanoclaw/blob/8da4b49ec02af1bc20e410de726f64a0234fbdc7/src/host-plugins/calendar-reminders.ts#L450-L485) · [Transaction](https://github.com/jbaruch/nanoclaw/blob/8da4b49ec02af1bc20e410de726f64a0234fbdc7/src/host-plugins/calendar-reminders.ts#L795-L818)

## Rollout

- Owner and readers ship through separate pipelines: the host deploy and the admin plugin publish
- A version bump follows `coding-policy: stateful-artifacts` Cross-Pipeline Schema Bumps
- On a version bump, heartbeat can drop a suppression, system-audit can add a finding, and Calendar holds reminders with unsupported occurrences.
