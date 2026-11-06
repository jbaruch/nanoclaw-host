---
alwaysApply: false
applyTo: "src/db-task-occurrences.ts, src/task-occurrence-writes.ts, src/task-scheduler.ts, src/state-migrations/**, skills/email-surface/**, skills/morning-brief/** — when writing or reading interrupted scheduled-attempt recovery intervals"
---

# Task Restart Recovery

## Required Read

- Before writing or reading interrupted scheduled-attempt recovery intervals, read `skills/host-contracts/references/task-restart-recovery.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Only the host owns interval writes/migrations. A lost terminal result is no success or worker-termination proof. Readers follow their declared recovery conditions; an interval never authorizes resending an already delivered message.
