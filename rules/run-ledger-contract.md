---
alwaysApply: false
applyTo: "src/db-task-occurrences.ts, src/task-scheduler.ts, src/state-migrations/**, skills/heartbeat/scripts/heartbeat-precheck.py, skills/system-audit/scripts/system-audit.py, skills/check-calendar/scripts/check-calendar-precheck.py — when writing, migrating or reading the task_occurrences run ledger"
---

# Run Ledger Contract

## Required Read

- Before writing, migrating or reading the host task_occurrences run ledger, read `skills/host-contracts/references/run-ledger-contract.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- The host scheduler owns writes and migrations. Container readers remain read-only; unsupported or unreadable state supplies no invented success or recovery proof.
