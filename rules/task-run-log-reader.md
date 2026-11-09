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
- Readers never initialize, migrate, backfill or substitute this database.
- Missing database, required schema or failed queries produce an actionable unavailable issue, never empty or healthy evidence.
