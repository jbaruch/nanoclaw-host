# Tessie host authority: policy 2/3, wire and command journal 1

Producer: `jbaruch/nanoclaw` `src/host-plugins/tessie/`. Consumer:
`jbaruch/nanoclaw-tesla` deterministic scripts. Default disabled
(`TESSIE_ENABLED=true` is required). This producer creates no OneCLI actor,
credential or grant and performs no provider operation on import or registration.

## Identity and protected policy

Native `tessie_request` uses `IpcHandlerContext.sourceGroup`, verified from the IPC
task directory. Resolve exactly one current registered JID for that folder,
rechecking after native I/O and before dispatch. Caller chat IDs and role fields
are never authority. Main IPC calls use the same protected role/VIN checks.

Host owner provisions `DATA_DIR/tessie-authority` at `0700`, owned by effective
host UID, and empty child `.agent-empty` at `0555`. Existing unsafe directories
block agent startup even when the feature is disabled or initialization fails.
`volume-mounts.ts` masks this directory in main's project view and additional
project aliases; direct additional mounts of private authority are refused.

`policy.json` is a regular single-link host-owned `0600` file, bounded to 1 MiB.
Reads use held, no-follow directory/file descriptors and validate identity and
metadata before/after reading. Linux leaf access stays beneath `/proc/self/fd`.
The same held directory anchors private command journals. No agent write API or
agent scratch fallback exists.

Protected `policy.json` version 2 has exactly `schema_version: 2`, `vehicle_selection`,
arrays `owner_chats`, `control_chats`, `read_chats`, `vehicles`, nullable
`default_vehicle`, and nullable integer `low_battery_percent` (1–100).
`vehicle_selection` is `explicit` or `non_archived`. Empty roles authorize nobody.
The host owner supplies actual existing chat identities during separately
owned setup. Agent scratch data never updates this policy.

In `explicit` mode, vehicles have exactly `vin`, normalized nonempty `alias`, and
boolean `shared`. VINs/aliases are unique; the default alias must be listed or
null. Live inventory must contain a selected listed VIN exactly once. Non-shared
entries require native `last_state.access_type === 'OWNER'` and
`is_active === true`. Protected `shared: true` explicitly permits that listed
vehicle's live account access.

In `non_archived` mode, protected `vehicles` must be empty and `default_vehicle`
null. This is the owner's explicit dynamic opt-in for every non-archived vehicle
in this Tessie account, including current or future shared vehicles. Each policy
projection, discovery, read or new control obtains fresh bounded `/vehicles`
inventory. Admit only unique valid VINs with actual `is_active === true` and
recognized native access `OWNER` or `DRIVER`; missing/null/unknown metadata never
grants access. Derived `shared` is false for OWNER and true for DRIVER. Newly
active/unarchived vehicles join without a policy edit; archived vehicles leave
before another provider operation. There is no snapshot writer, mirror or daemon.

Derive aliases from normalized nonempty native `last_state.display_name`, using
stable `Vehicle <VIN>` when absent. Duplicate names receive a VIN suffix that
fully disambiguates them; any remaining ambiguity refuses dispatch. Aliases are
presentation and confirmation inputs, never vehicle identity. A rename requires
the new exact `<alias>:<action>` confirmation; it cannot silently retarget a VIN.
Only admitted vehicles enter the schema-1 own-role client policy and inventory
projections. Normalize native nested access for that deterministic reader.

The compatible runtime reads protected policy versions 2 and 3. Version 3 adds
exactly `charge_automation`: null or the host-operator-provisioned configuration defined in
`tessie-calendar-charge.md`. Version 2 remains unchanged and grants no calendar
charging. Version 3 with null enrollment is likewise inactive. Publish and install
the dual reader before the host operator provisions a version-3 policy. No consumer migrates
or writes protected policy. An unsupported policy version
refuses with actionable `policy_version`; it is never silently accepted, migrated,
rewritten or treated as an empty/open policy. The host owner preserves the prior
file and provisions the reviewed version while the feature is disabled. Policy
version 1 was declared before the producer was enabled; no live writer cutover
or automatic migration is part of this source delivery. Deploy/install this
reader and authority before provisioning version 2 or enabling the consumer.

## Empty-disabled opaque mount exception

Known project views and resolvable project/private aliases always receive the
empty private-directory mask, even while Tessie is disabled or never provisioned.
Host spawn bootstrap may create only never-provisioned empty `0700` storage and
its owned, empty `0555` mask through held no-follow directories. Existing unsafe
storage refuses startup; bootstrap writes no policy or command authority.

A narrow exception preserves existing owner-approved host mounts whose paths are
opaque inside a Docker-out-of-Docker orchestrator. Preconditions (all required):

1. Tessie is disabled and the held private store contains only `.agent-empty`.
2. The mount passed the existing host-owner mount allowlist.
3. No other host authority requires resolving that mount; its stronger guard wins.
4. The host owner quiesces agent admission, retires every pre-provision agent
   including opaque-mount agents, and provisions policy/enables the authority
   before resuming admission. Existing containers cannot acquire masks later.

When Tessie is enabled or any private content is retained, refuse unresolvable
mounts with an actionable host-resolvable-path diagnostic. Later disablement does
not reopen mounts over retained policy, journals or unknown private entries.
Direct private mounts and canonical/physical symlink routes that bypass a known
mask remain refused. This exception grants no vehicle operation or policy writer.

## Existing OneCLI gateway

Use the existing owner-authorized normal `main` OneCLI route through `resolveOneCliRoute` and the
bounded no-redirect JSON helpers. The gateway injects the existing vaulted Tessie
key for exact `api.tessie.com`; no key value enters host request bodies, agent
containers, output, logs or chat. Existing OneCLI configuration is sufficient.
Missing gateway configuration refuses the request without direct HTTP fallback. The host's protected VIN/chat
checks apply before its provider requests.

## Wire schema

Task-file envelope uses native `requestId` (32 lowercase hex), native session name,
`type: 'tessie_request'`, and `payload`. `payload: 'policy'` returns only own-role
presentation and listed vehicles, excluding credential ID/other role JIDs.
Otherwise payload has exactly:

- `schema_version: 1`, `method: 'GET' | 'POST'`, fixed `path`;
- string-valued `query`, nullable JSON-object `body`;
- nullable `confirmation`, exact `<alias>:<action>` for controls.

`operations.ts` owns fixed routes, supported commands and parameter bounds. No
wake, uncached read, arbitrary query, header, URL or unsupported control exists.
Reads preserve provider cache defaults. Controls allow explicit Tessie attempts
1–3 and no host retry. Non-owner location/drivers requests are refused; every
other non-owner response uses a positive documented field projection. Unknown
fields are dropped on the host before IPC. Owner output still follows the
consumer's explicit location-disclosure rules.

Success has `schema_version: 1`, integer HTTP `status`, projected JSON `data`, and
for control receipts `dispatched_at_epoch` from the actual host dispatch boundary.
Errors have `schema_version: 1` and fixed safe `error: {code, message}`. Provider
error bodies, native credential metadata, paths, proxy configuration and headers
never enter this projection. Native atomic `writeScriptResult` publishes replies.

## Durability and confirmation

A fixed per-broker queue serializes authorizations and requests; pending work is
bounded to 32. Before a control POST, exclusively create and fsync a private
`command-<digest>.json` intent, then fsync its directory. Bind request ID to source
JID and complete normalized request (fixed field order and sorted query/body keys).
After durable intent I/O, recheck current registered identity and protected policy
immediately before POST. No POST occurs before intent durability.

The broker-owned `DATA_DIR/tessie-authority/command-<digest>.json` journals use
the Stateful Artifacts **Gate Store carve-out**: an existing uncertain intent
refuses a POST, while absence permits admitting a new intent. A reader meeting
an unsupported journal version refuses with the safe actionable `journal_version`
diagnostic: update the host reader for the retained schema, preserve the intent,
inspect cached vehicle state, and never delete the journal or replay the prior
command to recover. Only version 1 is currently accepted. If the owner later
accepts an older version, it must migrate and rewrite that older record on read.

The host owns journal schema 1. An intent has exactly integer `schema_version: 1`,
`binding` (lowercase SHA-256 of the source JID and complete normalized request),
and `outcome: 'uncertain'`. A completed record has exactly `schema_version: 1`,
the same `binding`, `outcome: 'complete'`, and `reply`. Its reply has exactly
`schema_version: 1`, integer HTTP `status` (100–599), `data`, and finite
nonnegative `dispatched_at_epoch`. A 2xx receipt's data has exactly boolean
`result`; every non-2xx receipt's data is null. The filename hashes source JID
and native request ID, independently of the request binding. Only version 1
completed records with all fields validated can be returned. Unsupported,
partial, malformed, mismatched or uncertain state is preserved and refused;
there is no implicit migration, guessed default, rewrite or fresh POST.

Completed identical native retries return their original receipt after current
policy/role and normalized request binding checks, before gateway/inventory I/O.
This is historical readback, including when a dynamic vehicle was later archived
or renamed; it never performs a new effect or admits a new intent. New controls
always require fresh live admission and current alias confirmation. No second
POST is sent. Different bindings, torn journals, timeouts and unknown outcomes never
replay automatically, including after restart. Keep private intent history until
the owner resolves uncertainty; no implicit pruning or manual erasure recovery.
Tessie `result: true` means acceptance only. The consumer requires matching state
with timestamp at or after host dispatch. Failed/stale readback preserves that
receipt as unconfirmed. No automatic resend follows uncertainty.

## Delivery and acceptance

Publish/install the matching `nanoclaw-host` authority before enabling consumers.
Merge this producer before publishing a reader. Keep broker disabled until native
VIN/chat policy is provisioned by the host owner. Deploy producer/consumer
through canonical host workflow, then separately verify installed bytes, real
role denial, cached sleeping-car reads, and one explicitly authorized reversible
control on a selected awake vehicle with post-dispatch readback. Verify actual
`tessie-watch` cadence registration before calling the recurring feature shipped.
This source change exercises synthetic fixtures only; Tesla issue #1 remains open
for runtime acceptance. Tesla2–6 follow the foundation; Tesla8 remains held. The separate Tesla7 running-late contract is `skills/host-contracts/references/tessie-running-late.md`; its proposals grant no vehicle control or location disclosure.

Regression owners: `src/host-plugins/tessie/*.test.ts`,
`src/container-runner.security.test.ts`, consumer `tests/test_native.py` and
accepted/confirmation regressions. No real vehicle, account, calendar or live
OneCLI policy operation is part of those fixtures.

## Calendar charging

Read `skills/host-contracts/references/tessie-calendar-charge.md` in full before
calendar charging, enrollment, polling or reusable energy estimates. It owns the
policy3/enrollment2 and home-bound schema-2 charge/notice gates in the same protected
Tessie store. Legacy nested enrollment1 remains basic-policy-readable but grants
no charging authority; legacy gate1 records remain typed holds, never absence. It adds no callback database migration, credential, role or agent-writable
authority. Existing manual Tessie requests and command-journal schema 1 retain
all their current checks. Source publication supplies no enrollment, installed
readiness, cadence or vehicle acceptance.
