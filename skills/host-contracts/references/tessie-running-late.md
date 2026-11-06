# Tessie running-late: proposal and wire1, private database4 records2

Contract: tessie-running-late-host-v1

Producer: `jbaruch/nanoclaw` `src/host-plugins/tessie-late/`. Consumer:
`jbaruch/nanoclaw-tesla` `tessie-running-late`. This is the bounded Tesla7
workflow, separate from vehicle controls, conference follow-ups, Tasks and refund
proposals. Import/registration performs no provider operation or grant change.

## Native identity and transport

Require the actual registered main source and its current protected Tessie owner
role. IPC directory identity, the current in-process registered-group map and the
host callback claim own these facts. Caller JIDs, role labels, environment hints,
JSON approvals and imported receipts grant nothing. Recheck registration and
protected policy after awaited I/O and immediately before effect dispatch.

Calendar reads use the existing normal-main OneCLI route and fixed primary
Calendar GETs, with complete bounded pagination. Vehicle discovery/status/state
compose the existing Tessie broker, including fresh dynamic inventory and cached
reads. No vehicle control, wake, uncached read, location test or alternate API
credential path is added.

Recipient email uses only the host-provisioned OneCLI identity
`nanoclaw-host-tessie-running-late`. Fresh native agent/grant readback must prove
that exact unique BYO identity, no channels or generic secrets, one Gmail
connection, custom tools `get_profile`, `search_messages`, `get_message`,
`send_email`, empty ASK and `otherReads/otherWrites: never`. Resolve only that
identity's route. Do not create/attach/grant through a consumer or reuse the
conference identity. Missing setup holds email delegation. The gateway injects
the credential; no key/proxy/userinfo is printed or returned.

The native Gmail profile binds the sender account displayed for approval.
Subsequent account changes refuse dispatch. Use the fixed Gmail profile,
Sent-message query/raw read and `messages/send` endpoints only. The finite shared
MIME/Sent transport is not an approval mechanism.

## Event and navigation evidence

Read the actual primary Calendar event. Bind its native ID, ETag, title, timed
start/end, location and contact fields into the private source hash. Instance IDs
keep recurring meetings distinct. Refuse cancelled, declined, malformed or
ambiguous source. Re-read native event state at approval and delivery.

Only current drive-engine schema1 `meeting_outbound` blocks qualify. Their
`dengine_leg` must identify the actual meeting, with consistent anchor and
location. Return, airport, unknown and unassociated blocks cannot trigger reads.
A fresh D-gear matching route may outlast the planned drive end, until the meeting
ends. No match or multiple matching vehicles means hold, never default selection.

Require native navigation timestamp no older than five minutes, nonfuture except
30 seconds of clock tolerance, recognized D gear, finite bounded minutes to
arrival and conservative destination identity. Case/spacing normalization grants
no substring, fuzzy place or semantic match. Navigation minutes already provide
the arrival estimate; do not add traffic delay twice.

A non-declined other attendee is waiting-contact evidence. A non-attendee external
contact requires actual event-bound owner approval after the model identifies
that contact; the selected mailbox must occur literally in current native event
contact evidence. Literal membership is not a semantic classifier. Never infer
approval or a recipient from arbitrary description prose alone.

## Pre-event approval

A proposal is native host data, not a caller draft. Prepare from actual event and
sender-profile reads. Store proposal JSON schema1 in a private record2 row, with opaque proposal ID, event ID/source hash,
title, start/expiry, recipient, sender account, fixed template version and creation
time in the private callback database. Bound proposal expiry to the event end and
the supported 24-hour window. A changed event needs a fresh proposal; an old
proposal cannot silently adopt changes.

The visible card names the event, start, expiry, recipient and sending account,
shows the fixed lateness template and states the total-two budget below. Native
`tessie.late.v1` callbacks carry only schema1, opaque proposal ID and the
approve/cancel decision. Require the exact private card text/buttons, actual
Telegram message binding, real owner sender and live host claim. Later polling
requires that claim to be resolved/applied, unexpired, source-bound and unchanged.
A generic `owner.answer.v1` reply is not this delegation.

Cancellation removes delegation without a provider call. It cannot erase prior
attempts or restore delivery slots. No automatic approval cards are sent while
driving; preparation is a separately requested pre-event owner workflow.

## Shared delivery budget and confirmation

At most **two automatic lateness messages TOTAL per native event**, across owner
Telegram notices and recipient email. Reserve each slot transactionally in the
private host ledger before dispatch. Initial delay must exceed ten minutes. An
optional worsening follow-up must exceed twenty minutes and the first delay.

The initial owner notice contains the delay and ready-to-send text. Without
recipient delegation, one worsening owner follow-up may use slot2. With recipient
delegation, the owner notice plus one recipient email consumes both slots; no
later follow-up is allowed. Separate proposals, changed recipients, cancellation,
restart and reapproval never reset the event budget. Pre-event owner-requested
approval cards are not automatic lateness notifications.

Each intent starts uncertain before external I/O. Failed, interrupted and
unconfirmed attempts consume their slots. Never automatically replay them.
Owner delivery requires the real native message ACK. Gmail requires the exact
account/recipient/subject/body/Message-ID in actual Sent evidence, with no second
POST on uncertainty. Provider IDs and apparent receipts never confer approval.
Only the explicit scoped readback path may confirm a retained original attempt.

Account/Sent preflight is awaited I/O. Re-observe the native event, current drive
block and fresh matching route before reserving recipient dispatch. Re-read the native sending profile after those awaited observations and refuse an account mismatch. Then recheck current owner scope, policy, approval and exact retained intent synchronously immediately before the sole POST. No third-party message contains coordinates, street addresses or a
vehicle alias; it uses the visible approved event-title/ETA template.

## Storage, wire and deployment

The artifact is `DATA_DIR/owner-callbacks/callbacks.db`, native private callback database6 after the outbound005 and Construction006 owner upgrades; running-late still owns migration004 and retained record2. The sole logical state owner is the host running-late component `src/host-plugins/tessie-late/store.ts`; its schema of record is `src/state-migrations/callback-004-tessie-running-late.ts`. `src/callback-store.ts` owns installation and ordered accepted database1→2→3→4→5→6 migrations, preserving predecessor constraints before any version write. The supported predecessor is `callback-003-promise-tasks.ts` from the Tasks source stack, preserving its tables plus existing callbacks and conference records. Outbound migration005 follows the preserved Tasks3/Tessie4 chain and Construction006 preserves those domains under `construction-journal-authority.md`; its historical unactivated outbound-shaped3 is not a supported Tasks3 store and remains held unchanged. Running-late preserves/refuses unknown predecessors unchanged and never changes another domain’s authority or tables.

Database5/envelope4 remains the supported outbound-only intermediate before Construction006. That producer need not install6 or emit5; the separately matched Construction-capable reader/writer pair supplies database6/envelope5. Running-late record2 and wire1 stay unchanged through both stages.

Every retained row has a required literal `schema_version: 2`, with SQL default2 only when the owner creates a row. The proposal JSON and native callback/wire remain schema1. Every other field is present; nullable fields use explicit null, never an omitted-field default. Current retained-record readers accept only2. The three tables are:

| Table | Complete record2 fields and formats |
| --- | --- |
| `tessie_late_proposals` | `proposal_id` unique lowercase hex64; `event_id` bounded native Calendar ID; `proposal_json` complete proposal1 JSON below; `proposal_sha256` lowercase hex64 of the owner's complete ordered proposal binding; `card_id` unique nullable native base64url22 card ID; `approval_callback_id` nullable base64url22 callback ID; `status` held/approved/cancelled; `schema_version:2`. An approved row requires its real card and approval callback. New held rows start with both IDs null. |
| `tessie_late_budgets` | `event_key` unique lowercase hex64 SHA-256 of the UTF-8 bytes of JavaScript `JSON.stringify(["primary", event_id])`, with the native event ID unchanged and no case/spacing normalization; required `calendar_id` exactly `primary`; required `event_id` nonblank bounded native Calendar ID1..512; the calendar/event identity is jointly unique; `deliveries` integer1 or2; `first_delay` integer11..1440 minutes; `max_delay` integer between first_delay and1440; `schema_version:2`. No zero-count or reset record exists. |
| `tessie_late_attempts` | `event_key` references the budget; `slot` integer1 or2, jointly unique with event_key; `channel` owner/recipient; `proposal_id` null for owner or a matching proposal reference for recipient; `payload_json` complete delivery payload below; `payload_sha256` lowercase hex64 of that exact payload binding; `attempted_at` canonical UTC ISO milliseconds; `status` sending/sent/uncertain; `receipt_json` null until a native acknowledgment or exact original readback; `schema_version:2`. Slot1 is owner, slot2 may be owner or recipient. Budget count and retained slots agree. |

Proposal1 JSON has exactly `schema_version:1`, `proposal_id`, `event_id`, `event_source_sha256`, `event_title`, `starts_at`, `expires_at`, `recipient`, `sender_account`, `template_version`, `created_at`. IDs/hashes match the row. Title is bounded160 characters, native event ID512, and mailbox fields are valid fixed-recipient/sending-account strings. Times are canonical UTC ISO milliseconds; expiry is after event start and creation and at most24hours after creation. `event_source_sha256` binds the complete current native event. `template_version` is exactly `tessie-running-late.v1`. No approval boolean, caller body or receipt exists in this shape.

Delivery payload JSON has exactly string fields `to`, `sender`, `subject`, `body`, `messageId`. Owner payload uses its native main Telegram JID and empty sender/subject/messageId; body is bounded owner notice/draft text. Recipient payload binds the proposal's recipient/account/title and fixed approved lateness template, fresh delay/UTC ETA, and deterministic event/slot Message-ID. A sent owner receipt is exactly `{id}` with a numeric native Telegram message ID string. A sent recipient receipt is exactly `{id,threadId}` with bounded native Gmail hex IDs. An uncertain attempt has a null receipt and still consumes its slot. The writer initially records uncertain before external I/O; a retained sending record projects as uncertain, never as permission to retry.

Before scoped reads or reservation, validate the bounded index of all retained budget keys against their literal primary-calendar/event identities. Moving budget and attempt keys together must not make a consumed original event look absent. Every producer and live/status/backup/restore reader uses that exact UTF-8 serialization and verifies the same bindings.

The writer is the native service through the store; the bound callback action only attaches a real card/owner decision. Polling and callback readers validate all required fields and recheck live native owner/event/account before using a recalled proposal. Public consumers receive only complete proposal cards or bounded counts and never read, write or migrate the private tables. Shapes do not change without owner migration and a version bump.

These named tables use the Stateful Artifacts **gate-store exception**. Unsupported database/record versions, malformed rows or exceeded bounds HOLD with instructions to preserve the store and update the host reader/migration owner. Never treat them as empty, downgrade, evict, delete or reinitialize to recover permission or delivery slots. The installer migrates every accepted older database on owner open; no older running-late record version is accepted as if it were current. Earlier unshipped record1 stores, including empty stores/envelopes, cannot establish the native identity of owner-only attempts and HOLD unchanged. No automatic record1 migration exists. Preserve the store, backups and every consumed attempt; keep the producer disabled until a reviewed owner migration can establish original native identities or a verified complete record2 backup can be restored. Never infer an identity from current events, rewrite old keys, clear gates or create an empty replacement.

The same host component's `ledger.ts` owns the inactive `tessie_late` record2 projection inside shared backup ledger5 `host/conference-followup-ledger.json`, alongside the existing conference, Tasks, outbound and Construction gates. It contains exactly `schema_version:2`, `proposals`, `budgets`, `attempts`. The arrays use the complete row shapes above, with all proposal card/approval IDs null and status cancelled, and in-progress attempts uncertain. Projection includes proposals referenced by consumed recipient attempts; it exports no callback rows. Bounds are4096 proposals/budgets and8192 attempts. Backup reads canonical ledger1/2/3/4/5 without erasing current gates. Offline restore alone may merge these records, preserving immutable bindings, every consumed slot and native acknowledgment monotonically; it never restores active approval. Unknown shapes or regressions refuse before replacement. The existing backup owner handles scanning/archive installation and never grants an effect.

Shared transaction-local capacity admission and reserved native-ACK growth follow `outbound-delivery-receipts.md`, including the32 MiB complete archive budget. A capacity refusal rolls back only the new undispatched slot; existing slots and uncertainty remain consumed. No pruning or automatic record migration is supplied.

`tessie_late_request` is a separate schema1 native operation. Its finite actions
are prepare, poll, status and cancel, with only the action's declared event,
recipient or opaque proposal IDs. No caller body, route, credential, role,
callback claim or receipt import exists. Fixed response envelopes expose only
owner-visible proposal cards or bounded status counts. Provider bodies, proxy
metadata, raw mail and private callbacks remain on the host.

The scheduled consumer polls every few minutes. The host owns deterministic
notification dispatch and exact delivery slots; the precheck does not ask the
model to send another lateness message. Failures remain visible in task/host
status and never route through an alternate API or credential.

Publish/install this authority and the matching Google-access authority, merge
the actual producer, then publish the consumer. Require its declared regular
callback adapter before registration. The host owner separately provisions and
verifies grants and genuine native context, deploys canonically and registers the
cadence. Synthetic fixtures, source merges and publication do not establish
installed or live delivery. Keep Tesla7 open until that acceptance is proven;
Tesla1's separate physical-control acceptance is unchanged.
