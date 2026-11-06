---
alwaysApply: false
applyTo: "src/ipc-handlers/messages.ts, src/channels/telegram*, src/conference-followup-ledger.ts, src/protected-delivery-capacity*, src/state-migrations/callback-005-outbound-deliveries.ts, skills/email-surface/**, skills/morning-brief/** — when interpreting outbound send results, recording delivery progress or maintaining shared protected delivery capacity"
---

# Outbound Delivery Receipts

## Required Read

- Read `skills/host-contracts/references/outbound-delivery-receipts.md` in full before the affected action.
- Resolve it within this installed plugin; missing or unreadable content stops the action.
- Its full text binds. Read explicitly; never load it through an `@` import.

## Current Send Contract

- Use the actual native send result and the workflow owner's declared bookkeeping contract.
- A successful delivery proves no owner decision or approval of another effect.
- An uncertain or failed send requires inspection before retry; a local marker cannot resolve it.

## Retained State

- The generic protected receipt producer, reader and activation flag are retired.
- Preserve retained migration tables and every active domain's gates through their native owner.
- Maintain shared capacity through the reference's current runtime contract.
