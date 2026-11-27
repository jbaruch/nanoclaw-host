---
alwaysApply: false
applyTo: "skills/heartbeat/scripts/heartbeat-checks.py, skills/check-calendar/scripts/check-calendar-precheck.py — when reading task_run_logs"
---

# Task Run Log Reader

- `jbaruch/nanoclaw` owns `task_run_logs`. Its `initDatabase` calls `src/db.ts:createSchema` to create the table and rebuild its foreign key inline. [Table definition](https://github.com/jbaruch/nanoclaw/blob/8da4b49ec02af1bc20e410de726f64a0234fbdc7/src/db.ts#L228-L238) · [Inline upgrade](https://github.com/jbaruch/nanoclaw/blob/8da4b49ec02af1bc20e410de726f64a0234fbdc7/src/db.ts#L366-L387)
- `src/db-tasks.ts:logTaskRun` appends native task outcomes.
- The unversioned table uses coding-policy's Read-Only Legacy Runtime Tables exception.
- The Main admin heartbeat's `check_task_failures` reads `/workspace/store/messages.db` through its native mount with read-only queries.
- Heartbeat requires `id`, `task_id`, `run_at`, `status` and nullable `error`. It uses native timestamps for lookback and later-run comparisons.
- The nightly GitHub backup recovery check also requires nullable text `result` on its own `precheck_skipped` rows. The agent runner's `container/agent-runner/src/precheck-emission.ts:buildPrecheckSkippedOutput` encloses the precheck's JSON data in an internal result. `logTaskRun` stores that result on the originating terminal row.
- Resolve the nightly task through the registered group folder in the host-provided `NANOCLAW_GROUP_FOLDER`. `src/cadence-registry.ts` constructs its ID as `cadence-registry::<group_folder>::tessl__nightly-backup`. An unavailable group identity supplies no recovery evidence.
- Only the exact scheduled nightly task's structured result can prove its backup outcome. `scheduled_backup_outcome_v1` is `committed`, `empty` or `error`. The first two can establish recovery after the latest failure. Follow the originating row's terminal timestamp. Null, malformed and legacy results, cadence skips, manual runs and unknown outcomes supply no recovery evidence. Keep raw result text out of notices.
- Readers never initialize, migrate, backfill or substitute this database.
- Missing database, required schema or failed queries produce an actionable unavailable issue, never empty or healthy evidence.

## Calendar reminder repair

- Admin's Calendar precheck opens the native `/workspace/store/messages.db` with `mode=ro`. Its entire legacy log read is an existence check on `task_id` for the exact ID stored in a version-1 `scheduled_reminders` row. Any matching row supplies attempt evidence and suppresses task-drift repair. Delivery remains unproven. The query needs no timestamps, status, result or error fields and exposes no log payload. See `skills/host-contracts/references/run-ledger-contract.md` for the other attempt markers and the host's final check. [Precheck query](https://github.com/jbaruch/nanoclaw-admin/blob/7f7193957f3a3231780c9e77eca1d08ca1933ff3/skills/check-calendar/scripts/check-calendar-precheck.py#L128-L153)
- A missing database, log table or required column, or a failed query, leaves repair unavailable. The precheck reports the SQLite error on stderr and exits 1 without a wake payload. [Log predicate](https://github.com/jbaruch/nanoclaw-admin/blob/7f7193957f3a3231780c9e77eca1d08ca1933ff3/skills/check-calendar/scripts/check-calendar-precheck.py#L143) · [Failed-read exit](https://github.com/jbaruch/nanoclaw-admin/blob/7f7193957f3a3231780c9e77eca1d08ca1933ff3/skills/check-calendar/scripts/check-calendar-precheck.py#L474-L478)
