---
alwaysApply: false
taskSnapshotContract: group-task-snapshot-v2
applyTo: "src/group-snapshots*, src/ipc-deps*, src/task-scheduler*, src/message-pipeline*, src/container-runner*, container/agent-runner/src/index.ts, container/agent-runner/src/format-task-row*, container/agent-runner/src/native-context-env*, container/agent-runner/src/run-script*, container/agent-runner/src/ipc-mcp-stdio.ts, container/agent-runner/src/task-cancel-result*, src/task-cancel-result*, src/ipc-handlers/tasks*, docs/task-cancellation-results.md, skills/**, rules/learning-evidence-runtime.md — when writing or consuming host group/task projections, accepted native dispatch metadata or terminal task-cancellation results, including learning evidence, reminder prechecks and watcher readers"
---

# Group IPC Snapshots

## Required Read

- Before writing or consuming group/task projections, accepted native dispatch metadata or cancellation results, including reminder prechecks, watcher and learning readers, read `skills/host-contracts/references/group-ipc-snapshots.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Host registration and IPC source establish scope; snapshots supply no owner approval, role, write or migration authority. Require supported versions and fresh exact operation bindings; never invent missing proof or replay an uncertain cancellation.
