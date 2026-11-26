---
alwaysApply: false
applyTo: "When implementing or operating a reader of NanoClaw browser-precheck-evidence events"
---

# Browser Precheck Evidence

NanoClaw owns the per-spawn container logs under
`containers/<group>/<session>/<spawn>.log` in the host log root.
The [producer contract](https://github.com/jbaruch/nanoclaw/blob/0696a1bca184a0b2227e7902535487506bee47e0/docs/browser-precheck-evidence.md)
names the schema of record, writer and retention implementation.
Main emits the event on stderr. The orchestrator persists it best-effort.
NanoClaw prunes whole files after seven days by modification time.

The Mini Watcher Chrome recovery report reads bounded excerpts without
changing them. Read only `[agent-runner] browser-precheck-evidence` events,
with or without the orchestrator's `[ERR]` prefix. Version 1 requires
`schema_version:1` and exactly one payload: `generation`, a distinct
`before` and `after` pair, or `generations` with 1–16 fingerprints.
Fingerprints are lowercase 64-character hexadecimal strings. The runner
validates shape only. Optional `source` is `linkedin`, `notion`,
`port-gmail` or `port-slack`. An absent source adds no per-source count.
Unversioned marked records are unsupported legacy version 0. Unknown
versions or malformed marked records make correlation unavailable. Unmarked
lines are ignored.

An absent event does not prove that a precheck did not run. A match does not
prove coverage and never authorizes restart, replay or website actions.
