---
alwaysApply: false
applyTo: "src/meeting-chat-*.ts, src/ipc-handlers/meeting-chat-context.ts, container/agent-runner/src/meeting-chat-tools.ts, skills/meeting-dossier/** — when implementing, invoking or activating meeting chat evidence"
meetingChatContextContract: meeting-chat-context-host-v1
---

# Meeting Chat Context

## Boundary

- Expose meeting chat evidence only to the actual registered main under its configured owner.
- Derive scope from host registration and fixed trusted sources.
- Caller roles, chats, paths and handles grant no authority.
- `event_id`, `attendee_emails`, `previous_occurrence` and `cursor` are search inputs, never Calendar or authorization proof.
- Keep current-chat history scoped to its actual source.
- This operation grants no send, provider-write, schedule or approval authority.

## Required Read

- Before every affected action, read the complete `skills/host-contracts/references/meeting-chat-context.md` within installed `jbaruch/nanoclaw-host`.
- Its full contract binds the affected action.
- Missing or unreadable provider identity, declared rule or reference holds the operation until the provider is restored.
- Never use a source-checkout document as installed authority.
- Never import the reference with `@`.
