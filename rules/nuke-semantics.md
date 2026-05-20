---
alwaysApply: true
---

# Nuke Semantics

## What gets killed

- The running container for the named group

## What is preserved

- Group registration in `messages.db`
- Group folder under `/workspace/group/<name>/`
- Per-group `.checkpoints/` (unless `skipReentry: true` is passed — see `nuke-payload-semantics` on the admin tile)

## After the kill

- Orchestrator respawns a fresh container on the next inbound message
- No manual restart needed
