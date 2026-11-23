---
alwaysApply: false
applyTo: "skills/heartbeat/scripts/heartbeat-checks.py — when reading task_run_logs"
---

# Task Run Log Reader

- `jbaruch/nanoclaw` owns existing `task_run_logs`; `src/db.ts:createSchema`, called by `initDatabase`, defines its table and inline foreign-key rebuild.
- `src/db-tasks.ts:logTaskRun` appends native task outcomes.
- The unversioned table uses coding-policy's Read-Only Legacy Runtime Tables exception.
- The Main admin heartbeat's `check_task_failures` reads `/workspace/store/messages.db` through its native mount with read-only queries.
- Required columns are `id`, `task_id`, `run_at`, `status` and nullable `error`; native timestamps supply lookback and later-run comparisons.
- The nightly GitHub backup recovery check also requires nullable text `result` on its own `precheck_skipped` rows. The agent runner's `container/agent-runner/src/precheck-emission.ts:buildPrecheckSkippedOutput` encloses the precheck's JSON data in an internal result. `logTaskRun` stores that result on the originating terminal row.
- Resolve the nightly task through the registered group folder in the host-provided `NANOCLAW_GROUP_FOLDER`. `src/cadence-registry.ts` constructs its ID as `cadence-registry::<group_folder>::tessl__nightly-backup`. An unavailable group identity supplies no recovery evidence.
- Only the exact scheduled nightly task's structured result can prove its backup outcome. `scheduled_backup_outcome_v1` is `committed`, `empty` or `error`. The first two can establish recovery after the latest failure. Follow the originating row's terminal timestamp. Null, malformed and legacy results, cadence skips, manual runs and unknown outcomes supply no recovery evidence. Keep raw result text out of notices.
- Readers never initialize, migrate, backfill or substitute this database.
- Missing database, required schema or failed queries produce an actionable unavailable issue, never empty or healthy evidence.
