---
alwaysApply: false
taskSnapshotContract: group-task-snapshot-v3
applyTo: "src/group-snapshots*, src/volume-mounts.ts, src/host-notice-ipc.ts, src/ipc-deps*, src/task-scheduler*, src/message-pipeline*, src/container-runner*, container/agent-runner/src/index.ts, container/agent-runner/src/format-task-row*, container/agent-runner/src/native-context-env*, container/agent-runner/src/run-script*, container/agent-runner/src/ipc-mcp-stdio.ts, container/agent-runner/src/task-cancel-result*, src/task-cancel-result*, src/ipc-handlers/tasks*, docs/task-cancellation-results.md, skills/**, rules/learning-evidence-runtime.md — when protecting projection mounts, selecting native floating scheduling or writing or consuming host group/task projections, accepted native dispatch metadata or terminal task-cancellation results, including learning evidence, reminder prechecks and watcher readers"
---

# Group IPC Snapshots

## Required Read

- Before protecting projection mounts, selecting native floating scheduling or writing or consuming group/task projections, accepted native dispatch metadata or cancellation results, including reminder prechecks, watcher and learning readers, read `skills/host-contracts/references/group-ipc-snapshots.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Host registration and IPC source establish scope. Only the fixed host producer and actual host dispatch supply projection, capability, occurrence and dispatch metadata; caller input, inherited environment and copied source supply no provenance.
- Protect projection data against consuming-container writes through every alias before capability selection or effect readback. Keep only existing canonical outgoing and own-session input surfaces writable; preserve visibility and repair isolation.
- Projections, capability declarations and dispatch metadata grant no identity, role, owner approval, write, migration, send, delivery or effect authority. Native capability metadata does not attest an arbitrary agent executable or replace the verified reader-first rollout.
- Require supported versions and fresh exact operation bindings. Never invent missing context, create a probe task for capability proof, convert retained reminder gates or replay an uncertain effect or cancellation.
