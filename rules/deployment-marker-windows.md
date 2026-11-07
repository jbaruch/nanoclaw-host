---
alwaysApply: false
applyTo: "scripts/deploy.sh, skills/heartbeat/scripts/heartbeat-checks.py — when writing or reading deployment window markers"
---

# Deployment Window Markers

## Logs

- `jbaruch/nanoclaw` `scripts/deploy.sh` appends one line per window to `data/host-logs/deploy-kills.log` (its force-kill interval) and `data/host-logs/tessl-update-window.log` (its plugin-update interval).
- Main agents read them read-only at `/workspace/host-logs/`.
- A line is `{"schema_version":1,"start":"<UTC ISO-8601 Z>","end":"<UTC ISO-8601 Z>"}`; legacy `<start>\t<end>` lines stay readable.
- deploy.sh runs as the agent identity, only appends, and creates new files at `0600` in a `0700` directory under `umask 077`.

## Readers

- Heartbeat readers never write, repair or migrate marker history.
- The admin heartbeat suppresses exit-137 failures only when `task_run_logs.run_at` falls inside a kill window or at most 60 seconds after its end.
- It suppresses registry-missing failures only inside an update window.
- An unreadable file or malformed line is actionable unknown coverage, never a window or a healthy result.
- Markers grant no effect, approval, delivery or completion authority.

## Task Run Log Reader

- `jbaruch/nanoclaw` owns existing `task_run_logs`; `src/db.ts:createSchema`, called by `initDatabase`, defines its table and inline foreign-key rebuild.
- `src/db-tasks.ts:logTaskRun` appends native task outcomes.
- The unversioned table uses coding-policy's Read-Only Legacy Runtime Tables exception.
- The Main admin heartbeat's `check_task_failures` reads `/workspace/store/messages.db` through its native mount with read-only queries.
- Required columns are `id`, `task_id`, `run_at`, `status` and nullable `error`; native timestamps supply window and later-run comparisons.
- Readers never initialize, migrate, backfill or substitute this database.
- Missing database, required schema or failed queries produce an actionable unavailable issue, never empty or healthy evidence.
