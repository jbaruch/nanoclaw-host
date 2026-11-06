# Construction journal: private database 6, records 1, backup 5

Producer: `jbaruch/nanoclaw` `src/construction-journal-*.ts`. Consumer:
`jbaruch/nanoclaw-construction` `skills/construction-costs/`. The consumer owns
source interpretation and its fixed version-1 callback wrapper; the host owns
approval, the native Sheets client and protected permanent facts. Imports,
registration, source tests and restored history grant no provider capability.

## Intake and exact review

Read the complete sanitized source before interpreting an invoice or payment
notice. A subject, snippet, sender label or filename cannot establish payment.
The model supplies cited facts; quote containment and hashes validate provenance
only. An unpaid invoice, pending notice or unclear payee, amount, actual payment
date, purpose, currency or method requires clarification. Never convert currency
or infer that receipt time is payment time. New rows use an ISO date, literal
purpose/payee, a positive exact two-decimal USD amount, and ACH, Wire, Check,
Cash or Card. Native binary64 representation must preserve exact cents.

The protected host `.env` key `CONSTRUCTION_SHEET_ID` selects the destination.
The expected title is Construction costs, locale en_US, sheet ID 0, title Sheet1,
with header Date/Purpose/Recepient/Amount/Payment type. Preserve that observed
header spelling and existing nonempty historical method labels. Read the
complete five-column journal, retain physical row numbers and reject partial or
malformed rows. Duplicate identity is normalized date/payee/amount; changing
purpose or method cannot hide a possible duplicate. A matching count requires
an explicit separate-payment warning and the «Добавить ещё» choice.

Main preview/status/cancel queries have schema version 1. Preview receives a
complete normalized row and source id/SHA256/summary hints, reads the journal,
persists a proposal and returns its exact text/buttons, opaque proposal id,
expiry and `write_authorized:false`. Status reconciliation uses reads only.
Cancellation retracts only unreleased proposals. No query accepts a target,
owner, gateway actor, credential, executable, host path or clock override.

Only the current registered Telegram main chat is eligible. Recheck the unique
binding and configured owner from host authority at each native boundary. The
host constructs a complete literal card of at most 2,800 UTF-16 units; refuse
oversized content rather than truncate financial fields. The «Добавить»/«Добавить ещё» and «Пропустить» payloads contain only schema version 1, a 22-character opaque
proposal id, exact row SHA256 and append/cancel decision. The private generic
card transaction binds the actual card id, original full text and both choices.
Accept only the canonical host card or its one literal `[M] ` maintenance
decoration; retain that exact native original and refuse other rewrites.
Release requires the real running callback, exact native message, configured
owner sender, current main/target, content digest and unexpired 24-hour card.
An ordinary owner-answer label or agent-written JSON cannot release a row.

## Owner language and private diagnostics

Render the owner card, choices and callback statuses in Russian while keeping
literal business values and wire identifiers unchanged. Never place financial
row values, source bodies or document excerpts in shared host logs, including
rejected requests and recoverable failures. Log routing/length/fixed error
metadata only. Classify validated construction cards as sensitive before
transport, with no caller-provided flag. Redact expected Telegram errors and
quarantine recoverable bad requests without replay; programming defects still
propagate.

## Installed callback and gateway

Registration requires the actual construction manifest to declare its skill
and `rules/construction-journal-callbacks.md`, with regular contained rule,
SKILL, callback reference and wrapper. The actual host manifest must declare
this authority rule and contain this reference. The fixed native module is
`dist/construction-journal-callback-cli.js` beneath the real host root.

The host launches its actual Node executable and the installed
`skills/construction-costs/scripts/construction-journal-callback-v1.mjs` with
one opaque callback id. Host-selected environment binds root, Node, main group,
main chat and configured owner. Select the trusted host cwd before importing
the compiled module. A private worker invokes
`runConstructionJournalCallbackV1(callbackId)` once. Keep imported logs private,
bound them at 8,192 combined bytes, and allow graceful native cleanup on error.
The public protocol is exactly `{status,text}`, using applied/rejected/stale/
failed, at most 200 valid Unicode scalars and 2,048 stdout bytes. Failures have
fixed redacted diagnostics. The host owns the 300-second execution deadline.

Use the dedicated channel-free BYO identity
`nanoclaw-host-construction-journal` in OneCLI grants mode. Require exactly one
custom Google Sheets connection, no secret grants, empty ask, exact allow for
get_spreadsheet/get_values/append_values and never for every other read/write.
Freshly validate the actual actor and grant catalog before native requests.
The existing vault injects Google credentials; no key enters agent state,
logs, request bodies or chat. Missing connection or grants refuses. Provisioning
that connection and actor is a separate host-owned setup action; source code
does not provision them or authorize a sample append.

Use bounded no-redirect native HTTPS helpers for the fixed Sheets API. Before
POST, reread metadata and the entire A:E journal, refresh the dedicated route
and synchronously commit the private claim. Append one row with INSERT_ROWS:
USER_ENTERED parses the US date, every text cell receives the literal apostrophe
prefix, and the amount is a validated JSON number. Do not substitute a generic
batchUpdate/appendCells capability absent from the actual gateway catalog.
Validate a successful native ACK: exact spreadsheet, one physical row beyond
the observed last row, five cells, exact returned normalized row and digest,
and host acknowledgment time. Confirm only after another complete read matches
the ACK's physical row/digest and expected duplicate count plus one.

## Permanent gates and backup

The host-private callback database `DATA_DIR/owner-callbacks/callbacks.db` stays
masked from agent project views. Its sole upgrader validates existing constraints
before migrating supported versions 1–6 and refuses unknown versions. Database
6 adds schema-1 held proposals and schema-1 permanent attempts after the complete
conference2/Tasks3/Tessie4/Outbound5 chain. An old outbound-shaped schema3 or
construction-shaped schema4 is unsupported and remains held unchanged. Proposals retain
complete row/target/source/digest, expected duplicate count, fingerprint and
expiry. Attempts retain those immutable bindings plus actual private card,
callback, owner/main identities, pre-dispatch intent time, optional native ACK and optional
confirmation time. This private store supplies authority; shared agent state
never replaces it.

Commit uncertain before dispatch. Unique source and duplicate-count slots and
unresolved duplicate-key gates prevent another card or request id from reopening
an attempted payment. Preserve uncertainty after lost or malformed responses,
timeout, storage failure, revocation or failed readback. A row's absence cannot
authorize retry. Capture a genuine ACK even if the card expires during POST;
later status recovery may add confirmation by exact positive read evidence,
but never resend. A confirmed payment is not reopened after manual deletion.

The core-owned `host/conference-followup-ledger.json` artifact retains its fixed
historical name/kind and now uses schema 5: conference, Task and Tessie gates,
outbound facts and a construction schema-1 permanent-attempt projection. The same core pipeline
ships its reader/writer. It accepts canonical artifact versions 1–5 and private database
versions 1–6; older artifacts retain current construction gates. Whole-domain
restore is atomic and monotone. Preserve uncertainty/confirmation and ACK facts;
refuse immutable conflicts and unsupported schemas. Restore no held proposals,
active cards or approval buttons. Capacity is 10,000 construction attempts and
the existing whole-artifact 32 MiB ceiling. Before dispatch, the same owning
transaction measures the complete candidate archive and reserves maximum
Construction ACK/confirmation growth. Overflow rolls back only new undispatched
work while retaining every existing gate; admitted ACK/readback completion needs
no fresh capacity admission.
Proposal storage is bounded at 10,000 retained rows. Reclaim only validated
cancelled or expired unattempted proposals in the admission transaction. Never
prune a proposal referenced by a permanent attempt, a still-live draft, or any
uncertain/confirmed gate. Full live capacity refuses without eviction.

Install this authority and the actual producer before publishing/activating its
consumer. Actual OneCLI connection/grants, installed private-state protection,
native full-source intake and owner card/approved append/readback acceptance
remain separate delivery gates. Never report a mock, local fixture, source
commit or registry publication as actual owner/provider acceptance.
