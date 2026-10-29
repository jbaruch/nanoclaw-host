# Calendar-aware vehicle charging

Contract: tessie-calendar-charge-host-v2

## Owners and admission

Core `src/host-plugins/tessie-charge/` owns the native workflow and reusable
measured-energy API. `nanoclaw-tesla` `tessie-charge` is its thin consumer.
Use only the existing protected `TessieStore` at `DATA_DIR/tessie-authority`.
The private-directory, numeric-owner, no-follow descriptor, single-link,
attachment and mask rules in `tessie-host-authority.md` apply unchanged.
No callback database migration or separate charge-authority directory exists.

The native IPC source must be the unique actual registered Telegram main group.
Revalidate that registry identity and protected policy after native I/O and
before effects. Caller chat IDs, roles, tier labels, booleans, JSON and estimates
supply no authority. Require the declared installed Host and same-provider Tesla
contracts and complete regular consumer transport closure before dispatch.
Missing, unknown or unenrolled authority holds without another HTTP route.

## Reader-first protected enrollment

Install the Core reader accepting exact policies 2 and 3 before any version-3
writer. Policy 2 remains byte-shape compatible and has no enrollment. Policy 3
adds exactly nullable `charge_automation`. Null keeps charging inactive.
Unsupported versions refuse; never downgrade, clear or rewrite them from an agent.
The current enrollment is nested schema 2. A legacy nested schema-1 enrollment
remains readable for existing basic Tessie policy compatibility. It supplies no
charging action authority; planning and controls hold with actionable
`charge_enrollment_version`. Do not assign it a guessed home timezone or upgrade
it from an agent. Top-level policy remains version 3.

Only the host operator provisions enrollment from an actual owner decision and grounded
native vehicle/calendar/home evidence. No consumer enrollment or policy writer
exists. Preserve the original decision and policy; source release is not approval.
The enrollment is a JSON object with exactly the following required fields.
There are no omitted-field defaults. Null is permitted only where stated.
Booleans are not numbers or integer schema versions. Enrollment text is nonempty,
trimmed, within the stated UTF-16 length, and excludes Unicode Cc/Cf/Cs/Zl/Zp.

| Field | Serialized type and format |
| --- | --- |
| `schema_version` | Integer `2` |
| `enrollment_id` | String matching lowercase `[a-f0-9]{32}` |
| `home_timezone` | Trimmed nonempty valid IANA string, at most 100 UTF-16 code units, exactly the current native `tz_state.home_tz` |
| `owner_chat` | Text of at most 200 units, exactly a protected `owner_chats` member |
| `default_vehicle` | Null or exact native alias/VIN text of at most 100 units |
| `daily_limit_percent` | Null or integer 50–100; expected baseline, never an invented observation |
| `home_saved_locations` | Array of 1–16 unique exact native labels, each text of at most 200 units |
| `event_vehicles` | JSON object with at most 1000 entries: exact native Calendar ID text keys of at most 512 units to alias/VIN text values of at most 100 units; `{}` means no explicit event mappings |
| `person_vehicles` | JSON object with at most 100 entries: exact driver-label text keys of at most 254 units to alias/VIN text values of at most 100 units; `{}` means no person mappings |
| `evening_hour` | Integer 0–23 in the native home IANA timezone defined below |
| `cold_buffer_fraction`, `highway_buffer_fraction` | Finite numbers 0–2 |
| `reserve_percent` | Finite number 0–50 |
| `charge_rate_kw` | Null or finite number greater than zero and at most 1000 |

Mappings are planning data inside protected enrollment. They never grant access
outside current `non_archived` inventory. Use the current native dynamic fleet;
no hardcoded VIN allowlist, frozen inventory or guessed attendee mapping exists.
An unknown selector or conflicting/unknown source holds the plan.

## Native sources and estimation

Calendar charging uses only the nonempty IANA `home_tz` returned by the host's
`src/db-tz.ts::readTzStateForContext()` for supported `tz_state` schema 4.
Missing, unsupported, non-string or invalid home timezone holds. Never substitute
travel/current timezone, agent context, container `TIMEZONE`, UTC or a caller
value. Require enrollment2 `home_timezone` to match it at every runtime fence.
Use this home clock for today/tomorrow, day boundaries, `evening_hour`, planning
days and notice days. A home change or a mismatch in a retained record holds
before effects; it does not authorize changing the bound enrollment or history.

Before planning effects or looking up a new notice day, perform a bounded
inventory of ALL `charge-notice-*` leaves, alongside the existing complete
charge-state discovery. Reject malformed names, unsupported versions, unknown
or invalid fields and mismatched filename/owner/day/home bindings. An old
reservation under another day must never disappear through the new day lookup.
Legacy schema-1 charge and notice records remain byte-exact typed holds,
including those under an old day filename. Do not migrate, retag, rekey, erase,
reset or guess their timezone. No automatic migration of these legacy records
is provided here.

Read the maintained drive-engine schema-1 private Calendar metadata, native IDs,
revisions and zoned start/end times. Titles and city strings do not identify
managed drives. Include complete next-day pages and re-read retained original
drive identities before cancellation or restoration; partial history never
proves that a drive disappeared. Preserve ordinary meetings as non-drive data.

Use the existing normal main OneCLI route for fixed primary Calendar GETs,
fixed Google Distance Matrix driving reads and the fixed Tessie broker routes.
Maps uses the existing gateway query placeholder, never a raw key or a new
credential. No consumer may call Tessie or Google directly or change a grant.
An ASK/denied/unavailable route holds without a fallback.

Use dated Tessie battery-health capacity (at most 90 days) and positive recent
weighted driving consumption (at most 30 days), including documented consumption-
since-charge data. Tessie history distances default to miles; convert to km.
Never substitute rated range. Route distance times measured consumption includes
explicit cold/highway allowances and reserve. A charge-speed estimate requires
measured positive power or the owner's configured fallback. Stopped/no-power
charging never becomes an invented charge forecast or an unplugged assertion.

The reusable per-vehicle estimate returns measured capacity/consumption,
measurement time, conditional expected departure charge and minimum energy stops.
It is forecast data, not charger availability, a promise of full charging, or
control authority. Reject nonfinite derived values. Estimates never create a
control intent, enroll a vehicle or send a notice.

## Limit lifecycle and private gates

Read-only observations are bounded-age cached values; never wake the vehicle.
Outside 50–100, hold rather than clamp or create an unrestorable baseline.
Remember the actual native daily baseline even on an observed no-change run.
A later observed limit change becomes a sticky owner-override hold. A native
manual `set_charge_limit` intent also makes existing charge records for that VIN
sticky before its POST, including an observed manual A→B→A sequence.

In the enrolled evening in the home zone, raise only for the measured shortfall
on the next home calendar day and never above 100. If disconnected, attempt one bounded owner notice with the shortfall.
If the round trip exceeds usable charge, report minimum energy charging stops.
Restore the exact retained daily baseline only when the drive is actually done
and the vehicle is back home, or its original native drive block has an exact
returned cancelled status or exact native HTTP 410/global/deleted error. Other
410 responses and inaccessible/404 originals remain unknown; a bounded
day query never proves cancellation merely by omitting an old event.
A home label requires matching current cached coordinates with the bounded-age
native state; do not infer home from a label on an unrelated cached position.

Use fixed host-owned `charge-state-<digest>.json` records in the existing store.
Both charge-state and charge-notice records are host-owned JSON gate stores
under the Stateful Artifacts Gate Store carve-out. Exact field presence is
mandatory; there are no omitted-field defaults or extra fields. Unsupported,
future, malformed, unreadable or misbound state refuses rather than becoming
absence. No retained record can replay an old command or reopen a notice slot.
Only home-bound version 2 is accepted for charging. Legacy version 1 is retained
and refused, never treated as absence. An unsupported charge-state version emits safe code
`charge_state_version`; an unsupported notice version emits
`charge_notice_version`. The native error envelope preserves that code and this
fixed message: "Calendar charge gate version is unsupported. Update the installed
host charging reader for the retained schema; preserve all charge-state and
notice records. Never reset a gate, erase history or replay an old command."
Consumers must retain an actionable update/preserve/no-reset diagnostic rather
than treating the refusal as absent state. If a future owner accepts an older version, it MUST migrate and
rewrite that supported older record on read before using it; the consumer cannot
migrate, reset, erase or prune either gate. Keep uncertain effects held.

A charge-state record has exactly:

| Field | Serialized type and format |
| --- | --- |
| `schema_version`, `kind` | Integer `2`, literal string `calendar_charge` |
| `owner_chat` | Nonempty string of at most 200 UTF-16 units; bound to the actual enrolled native owner |
| `vin` | String matching `[A-HJ-NPR-Z0-9]{17}`; bound to current admitted inventory before control |
| `enrollment_id` | Lowercase hex32 string matching the enrollment epoch |
| `day` | Real calendar date string `YYYY-MM-DD` for the original home-zone planning day |
| `home_timezone` | Trimmed nonempty valid IANA string of at most 100 UTF-16 code units, bound to the current native home and enrollment2 timezone |
| `phase` | String `idle`, `active`, `held` or `owner_override` |
| `hold_reason` | Null or string `uncertain`, `unconfirmed`, `refused`, `not_dispatched`, `manual_limit_changed` |
| `baseline_limit` | Integer 50–100 from the original native daily observation |
| `managed_limit` | Null or integer 50–100 |
| `leg_keys` | Array of 0–2000 unique nonempty strings, each at most 1000 units; logical native drive identities |
| `event_refs` | Array with one exact `{id, leg_key}` object per retained leg; unique `id` strings match `[A-Za-z0-9_-]{1,512}`, unique `leg_key` strings exactly cover `leg_keys` |
| `last_end` | Finite nonnegative epoch-millisecond number; original last planned end, or zero before any managed drive |
| `pending` | Null or the exact attempt object below |
| `before` | Null or the exact pre-attempt checkpoint below; null exactly when `pending` is null |

An attempt has exactly `request_id` (lowercase hex32 string), `action` (string
`raise` or `restore`), `from_limit` and `to_limit` (integers 50–100), `attempted_at`
(finite nonnegative epoch milliseconds), and `accepted_at` (null or finite
nonnegative epoch milliseconds no earlier than `attempted_at`). Raise requires
`to_limit > from_limit` and `managed_limit == to_limit`. Restore requires
`from_limit == managed_limit > to_limit == baseline_limit`.

A pre-attempt checkpoint has exactly `day`, `phase`, `managed_limit`, `leg_keys`,
`event_refs` and `last_end`, with the same types and formats as the enclosing
record. `phase` is only `idle` or `active`, with those phase invariants. It cannot
nest a checkpoint, change owner/VIN/enrollment/`home_timezone`/baseline, or carry an intent.
Its active `managed_limit`, otherwise the enclosing `baseline_limit`, must equal
`pending.from_limit`. The entire serialized charge record, including checkpoint,
must fit the existing store's 1 MiB bound before any mutation.

- `idle`: `managed_limit`, `pending`, `before` and `hold_reason` are null. Retained original
  leg references may remain as inactive history.
- `active`: managed limit is above baseline, at least one leg remains, and
  `pending`/`before`/`hold_reason` are null.
- `held`: pending and hold reason are nonnull. `unconfirmed` requires a nonnull
  accepted timestamp; `uncertain`, `refused` and `not_dispatched` require null acceptance.
- `owner_override`: hold reason is `manual_limit_changed`; retain prior managed
  limit, references and any otherwise-valid pending attempt without replay.

The fixed filename is `charge-state-<digest>.json`. `<digest>` is the lowercase
64-character SHA-256 hex digest of the UTF-8 bytes of ECMAScript
`JSON.stringify([owner_chat, vin, enrollment_id])`, with those exact field orders,
no replacer/spacing argument and no trailing newline. JSON string escaping and
array delimiters provide the framing. Rebind every loaded row to that exact
filename; no raw identifier or caller path selects a file.

Durably retain the charge intent before the existing broker's command intent and
single provider POST. Recheck current calendar, native identity, policy, dynamic
vehicle/alias, private pending gate and actual observed limit before dispatch.
Set Tessie's attempts to 1 and do not retry an unknown control. Acceptance stays
unconfirmed until a state timestamp at/after dispatch shows the requested limit.
Retain accepted receipts through failed confirmation and allow read-only matching
readback recovery without another POST. Any refusal or uncertainty after the POST boundary keeps the intent held. A
provider non-success alone does not prove that no vehicle effect occurred.

Only the broker may record `not_dispatched`, after a typed source/state preflight
failure while its actual provider-POST boundary has not been entered. A caller
error label or JSON cannot supply this witness. At the next poll the owner may
restore only that exact charge checkpoint, conditional on the current entire
record and pending operation still matching the retained no-send witness, and on
current native owner/enrollment authority. Recheck authority against the held
file immediately before its update. A changed record, revocation, enrollment
epoch or sticky manual override refuses restoration without modifying the newer
state. Never restore an older policy. Keep the original command tombstone;
fresh native facts and a new request identity are mandatory for any new plan.
Unknown effects and accepted unconfirmed commands never use this recovery.

Tessie supplies no expected-limit/CAS parameter. A Tesla-app mutation after the
last cached observation, including an ABA change, is not observable. Do not claim
absolute protection or atomicity across Calendar, Tessie and external apps.
The host operator must present this limitation for the owner's acceptance; visible changes
hold, and no source or fixture can prove the unobservable race absent.

## Notices and wire

`charge-notice-<digest>.json` is the host-owned schema-2 gate for one notification per owner and home calendar
day. Its filename digest uses the same SHA-256/UTF-8/compact
`JSON.stringify` framing as charge-state, over exactly `[owner_chat, day]` in
that order with no trailing newline. It has exactly integer
`schema_version: 2`, literal string `kind: calendar_charge_notice`, `owner_chat`
(the exact current native owner string), `home_timezone` (a trimmed nonempty valid IANA string of at most 100 UTF-16 code
units, matching both native home and enrollment2), `day` (the real `YYYY-MM-DD` date
in that timezone), `phase` (string `reserved`, `submitted` or `uncertain`), and
`plan_sha256` (lowercase hex64 SHA-256 of the complete UTF-8 notice body). All fields
are required; no nulls, defaults or extra fields are admitted. The same gate-store
version/malformed/read/migration/refusal contract above applies to this reservation.

Reserve before send; crash/timeout consumes that day's slot. Every valid existing
phase prevents a second attempt. Submitted means the native send call resolved,
not a fabricated delivery acknowledgment. A failed notice retains uncertainty.

Use one bounded Russian message per enrolled evening in the home zone. Keep all structured vehicle
outcomes in the native poll result; aggregate long fleets without silent text
truncation or channel chunking. Do not send model duplicates. Confirmed raises,
accepted-but-unconfirmed requests and unplugged shortfalls remain distinct.
No action or pending notification means silence; restoration is silent.

Native `tessie_charge_request` payload schema 1 has exact operations:

- `poll`: no caller fields beyond `schema_version` and `operation`;
- `status`: private bounded counts, no provider/vehicle request;
- `estimate`: additionally exact `vehicle`, finite `distance_km` (0–100000), and
  zoned ISO `departure`, no more than 14 days from the native clock.

Payload route/body/role/enrollment/approval/receipt fields are forbidden.
The transport uses actual native request IDs and source IPC directory; it does
not create main context. Fixed safe errors preserve holds without provider prose.

## Source and native acceptance

For this v2 contract-only bootstrap, publish and install the matching
`tessie-calendar-charge-host-v2` and `tessie-calendar-charge-consumer-v2`
contracts first. This predecessor consumer release changes no Python runtime or
wire1 behavior. Incumbent Core v1 contract checks must hold v2. Do not enroll or
activate calendar charging during bootstrap. Preserve existing policy and gates;
keep any existing cadence paused with its prior status recorded. Then merge and
install the compatible Core v2 reader. Every other producer/consumer release
retains the normal producer-first order in `tessie-host-authority.md`.

After installing compatible readers and verifying native identity/home/policy
bindings, the host operator provisions a new enrollment epoch from an actual
owner decision. Live-effect acceptance remains separately approved; the owner
decision need not be reissued after installation. Verify the installed reader
holds legacy enrollment1 and every legacy charge/notice gate before enabling
any schema-2 writer. All matching Host/consumer-v2 contracts and the compatible
Core reader must be installed first; stale v1 authority cannot authorize the
new writer. An empty current store proves only that native clean start, not
permission to reinterpret older records elsewhere.

Keep consumer cadence absent until the host operator separately registers and
verifies the actual main cadence after enrollment. Pin its schedule timezone
to the verified home IANA, not the scheduler's travel-following `local` token.
Verify the next run against that home wall time and reverify the cadence if the
native home timezone changes. No source test or publish operation performs that
activation.

The host operator owns native allowed/denied scope checks, current inventory/zone/Calendar and
Maps read acceptance, preserved private masks/identities, and an expressly approved
reversible raise→restore with fresh state, cancellation, unplugged silence/budget
and manual-override checks. Verify actual channel receipt separately. Keep Tesla #2
open until that runtime acceptance and the stated unobservable-race limitation
are resolved with the owner. Deterministic source and fake-provider fixtures
supply no vehicle, delivery, enrollment or genuine-owner runtime proof.
