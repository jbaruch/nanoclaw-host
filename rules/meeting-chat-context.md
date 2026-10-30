---
alwaysApply: false
applyTo: "src/meeting-chat-*.ts, src/ipc-handlers/meeting-chat-context.ts, container/agent-runner/src/meeting-chat-tools.ts, skills/meeting-dossier/** — when implementing, invoking or activating meeting chat evidence"
description: Main-only registered-chat evidence, native member identities, source coverage and installed provider ordering
meetingChatContextContract: meeting-chat-context-host-v1
---

# Meeting Chat Context

## Boundary

- Expose meeting chat evidence only to the actual registered main under its configured owner.
- Derive scope from host registration and fixed trusted sources; caller roles, chats, paths and handles grant no authority.
- Keep current-chat history scoped to its actual source; this operation grants no send, provider-write, schedule or approval authority.

## Required Read

Before implementing, invoking, changing or activating this operation, read the complete
`skills/host-contracts/references/meeting-chat-context.md` within this installed
`jbaruch/nanoclaw-host` provider. Its full contract binds the affected action.
Missing or unreadable provider identity, declared rule or reference holds the
operation until the provider is restored. Never use a source-checkout document
as installed authority or import the reference with `@`.
