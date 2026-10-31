---
alwaysApply: false
applyTo: "src/host-plugins/tessie/**, src/host-plugins/tessie-late/**, src/host-plugins/tessie-charge/**, src/host-plugins/tessie-brief/**, src/volume-mounts.ts, skills/tessie-*/**, tests/test_native.py, docs/tessie-host-authority.md — when implementing or using native Tessie vehicle authorization, routing, receipts, location projection or private mount/mask handling, or producing, consuming or enabling running-late proposals, callbacks, polling or mail, or calendar-charging enrollment, polling, status or estimates, or read-only vehicle morning summaries"
---

# Tessie Host Authority

## Required Read

- Before producing or consuming native Tessie requests, changing protected vehicle policy, gateway routing or private mounts/masks, relying on the empty-disabled opaque mount exception, or claiming installed readiness, read `skills/host-contracts/references/tessie-host-authority.md` in full.
- Resolve the reference within this installed plugin.
- Its full text and named sections bind as rule content.
- Missing or unreadable content stops the affected action.
- Read explicitly when triggered.
- Never `@`-import the reference.
- Before producing, consuming or enabling running-late proposals, callbacks, polling or mail, also read `skills/host-contracts/references/tessie-running-late.md` in full.
- Its full text binds.
- Missing or unreadable content stops that action.
- Before producing, consuming, enrolling or enabling calendar charging or its estimates, also read `skills/host-contracts/references/tessie-calendar-charge.md` in full.
- Its full text binds.
- Missing or unreadable content stops that action.

- Before producing or interpreting the read-only vehicle morning summary, also read `skills/host-contracts/references/tessie-morning-brief.md` in full.
- Its full text binds; missing or unreadable content stops the action.

## Native Ownership

- Host `jbaruch/nanoclaw` owns schema-1 `tessie_request`/journals and schema-2/3 protected VIN/chat policy.
- The host owns fixed main-only read-only `tessie_brief_request`; it grants no wake, control, notice, policy or journal writer.
- The host owns main-only `tessie_charge_request` and private charging gates inside the existing Tessie store.
- Only host-operator provisioning from an actual owner decision enrolls automatic charging; consumer payloads and files grant no enrollment or control.
- The host owns `tessie_late_request`, private running-late callbacks and retained proposal/budget/attempt state.
- Only a native event-bound owner callback delegates recipient mail.
- Use only the dedicated `nanoclaw-host-tessie-running-late` Gmail identity for that delegation.
- Caller payloads, agent files, generic replies and pasted receipts grant no lateness dispatch authority.
- Honor protected `non_archived` selection through fresh live inventory, including authorized active shared vehicles; never substitute a frozen VIN snapshot.
- Agent scratch files, roles, payload chat IDs and tier labels grant no vehicle or location authority.
- Use the existing normal OneCLI route and vaulted Tessie API key.
- Keep provider key values out of host request bodies, agent containers, logs and chat.
- Never fall back to direct HTTP or provision a new credential through a consumer.

## Enablement and Receipts

- Always mask known project/private aliases, including disabled or never-provisioned storage.
- Refuse direct private mounts and physical symlink routes that bypass a known mask.

- Keep the default-disabled producer inactive until protected policy, existing gateway and installed authority are ready.
- Merge the actual producer before publishing consumers, except for the bootstrap below.
- Narrow exception for the calendar-charge v2 contract-only authority bootstrap.
- Applies only to matching Host/consumer-v2 contract publications with unchanged consumer Python and wire1; incumbent Core v1 contract checks hold v2.
- Preconditions are binding: read `skills/host-contracts/references/tessie-calendar-charge.md` Source and native acceptance in full before relying on this ordering.
- Every other producer/consumer publication retains producer-first ordering.
- Require fresh registered scope and live admitted VIN before provider dispatch.
- Apply the named empty-disabled opaque mount exception only with its full quiescence, retirement and retained-state preconditions.
- Preserve accepted controls when confirmation fails.
- Unknown outcomes never permit automatic replay.
- Require post-dispatch state evidence before reporting confirmation.
- Keep runtime vehicle acceptance separate from source tests and publication.
