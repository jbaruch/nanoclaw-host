# Group IPC Snapshots

Contract: group-task-snapshot-v3

## Owner and Versions

- Host `jbaruch/nanoclaw` owns `/workspace/ipc/current_tasks.json` and `/workspace/ipc/available_groups.json`; `src/group-snapshots.ts` writes both projections.
- Task projection protocol `group-task-snapshot-v3` accepts legacy top-level arrays with record versions 0/1, unchanged published version-2 envelopes and the current version-3 envelope below.
- A version-3 envelope has exactly `schema_version`, `group_folder`, `generated_at`, `capabilities` and `tasks`.
- `schema_version` is integer 3; `group_folder` is the actual registered receiving folder, using the folder syntax below; `generated_at` is the host's canonical UTC ISO-8601 timestamp with milliseconds.
- `capabilities` has exactly boolean `floating_once` and `floating_cron`. The compatible host produces these declarations from its implementation, never caller input or a mutable readiness flag.
- `tasks` is a complete array of version-3 task records for that receiving view. Empty arrays remain complete; the envelope can declare feature support without inventing a task.
- Version-3 records retain every version-1 field and required `schedule_timezone`. Their `schema_version` is integer 3. The finite historical retention grammar below belongs to version 3, not the published version-2 format.
- Published version-2 envelopes retain the same five envelope fields, integer version 2, boolean capabilities and exclusively version-2 rows. Their original strict usable-record grammar remains unchanged; expanded historical forms never become version-2 records.
- `schedule_timezone` is the actual stored null, literal `local` or valid IANA name. Do not synthesize it from current timezone, prompt, next run or missing source data.
- Current interval and offset-aware once inputs have null timezone. A zone-bearing once retains its strict offset-free wall time; a local cron retains its actual cron expression. Preserve the finite historical inventory cases below without turning them into new scheduling inputs.
- Every record version follows the structural field contract below. The table defines usable selected-record proof; the retained historical cases below remain read-only inventory. Unknown source values remain unknown; no field receives an invented default.
- `context_mode` is the actual `group` or `isolated` value, never a default inferred from prompt or script.
- Legacy task records have absent `schema_version` or integer `schema_version: 0` and the same original fields below except `context_mode`; that field is absent or ignored in version 0 and supplies no context-mode proof.
- Group snapshots carry integer `schema_version: 1`, a `groups` array and UTC ISO-8601 `lastSync`; each group record explicitly carries integer `schema_version: 1` and the field contract below.
- Ignore top-level JID-keyed agent scratch entries when resolving registered scope.
- Malformed legacy source values may be copied unchanged; they supply no usable effect proof and receive no fabricated identity, context, timestamp or other default.

| Task field | Presence, JSON type and format for a usable record |
| --- | --- |
| `schema_version` | Required integer 3 for a version-3 envelope row; integer 2 for unchanged version-2 rows; integer 1 for version 1; absent or integer 0 for legacy version 0 |
| `id` | Required nonempty string containing the exact native task id; opaque, no default |
| `groupFolder` | Required string naming the registered folder; native folder syntax is `[A-Za-z0-9][A-Za-z0-9_-]{0,63}`, with reserved `global` excluded |
| `prompt` | Required stored prompt string; historical serialized Buffer values may be displayed defensively but never satisfy an exact string binding |
| `script` | Optional string or null; omission/null means no script; native refreshers may omit an empty string, which supplies no executable-script proof |
| `schedule_type` | Required string `cron`, `interval` or `once` |
| `schedule_value` | Required string: native cron expression, decimal interval milliseconds or native ISO-8601 once value; legacy once values may use host-local time |
| `context_mode` | Required version-1/2/3 string `group` or `isolated`; absent/ignored in version 0 |
| `schedule_timezone` | Required actual null, `local` or valid IANA string in versions 2/3; absent/unproven in legacy versions |
| `status` | Required stored string `active`, `paused` or `completed`; cancellation removes the task |
| `next_run` | Required native ISO-8601 timestamp string or null; no fabricated next run |

| Group field | Presence, JSON type and format |
| --- | --- |
| `schema_version` | Required integer literal 1 on every record |
| `jid` | Required nonempty opaque native chat-id string |
| `name` | Required native display-name string; no identity or approval authority |
| `lastActivity` | Required native ISO-8601 activity timestamp string |
| `isRegistered` | Required boolean |
| `folder` | Required registered folder string when `isRegistered` is true; otherwise optional, with no default; same folder syntax as task records |
| `containerConfig` | Optional host registration-config object; never caller-supplied role authority |
| `requiresTrigger` | Optional host registration boolean; no synthesized default |

## Retained Historical Inventory

Separate a complete read-only inventory from a selected task's usable effect proof. This distinction applies to legacy arrays with record versions 0/1 and current version-3 envelopes. Keep every supported record's actual id and raw stored fields; never drop a historical row, rewrite its schedule or infer a missing timezone to make an inventory usable.

The following complete historical records can remain in an inventory without supplying new effect proof:

- Stored `status: cancelled` is a retained historical tombstone. Keep its id present; it is not authoritative native removal, active creation or permission to re-arm an effect. Current native cancellation still removes the task.
- A once record with null timezone may retain a calendar-valid `YYYY-MM-DD`, or `YYYY-MM-DD` followed by `T` or one space and `HH:mm[:ss[.fraction]]`. Preserve the literal. Arbitrary human date strings and invalid calendar/time components are not accepted by this compatibility path.
- A strict valid offset-aware ISO once value may retain an actual historical named IANA timezone. Preserve that name; do not replace it with null or reinterpret it as floating. The literal `local` does not qualify for this historical exception.
- An interval may retain its actual nonempty stored string when the native `parseInt(value, 10)` result is a finite positive safe integer, including historical fractional or suffix forms. Preserve the full string; do not replace it with the parsed integer. A selected isolated watcher still requires the exact declared decimal interval contract.

These cases do not relax required fields, JSON types, supported record versions, unique ids, actual scope, stable attachment or freshness. Partial records, unknown forms and malformed native declarations still hold the operation. A complete retained inventory can establish that a selected id is absent only by retaining and checking every id; a cancelled or unusable selected row is still present.

Creation, native wake, watcher binding and cancellation recovery separately validate the selected task's usable status and its exact intended schedule, timezone, context, script and prompt. Historical retention does not verify creation, authorize a claim/send, re-arm an uncertain cancellation or enable a native reminder from a historical row. A capability declaration describes the installed host implementation, not those historical rows' execution or delivery.

## Native Scheduling Declaration

Read the installed `jbaruch/nanoclaw-host` provider's declared group-IPC rule and this complete reference before selecting native scheduling. The rule's `taskSnapshotContract` marker is `group-task-snapshot-v3`. A source checkout, copied document, tool listing, caller-supplied JSON or probe task supplies no installed capability proof.

A complete, fresh, scope-matching version-3 envelope on the protected host projection can declare current host floating support. Supported legacy arrays and published version-2 envelopes remain read-only compatibility inputs and do not enable new native plans. A legacy array supplies no timezone proof. Malformed, unsupported, linked, stale or rebound input holds the operation; it is not an empty inventory or a successful fallback. Validate every record and unique native id before effect readback or absence proof.

Capability-only discovery distinguishes the absence of a current declaration from effect proof. After fixed-path, bounded regular-file, single-link and unchanged held/named attachment checks, a legacy top-level array means unavailable for native selection even if its age or row content cannot prove an effect. That discovery result never validates the array for creation, cancellation or absence; those readers still require the complete supported inventory and operation freshness. Malformed, unsupported or stale native envelopes remain refusals, not a successful fallback.

The projection must be protected against writes by its consuming container through every alias before capability selection or effect readback. Trusted/Main mount the fixed IPC directory read-only, with only the existing canonical outgoing messages/tasks and own-session input directories writable. Preserve untrusted visibility and repair-lane isolation; refuse additional writable aliases intersecting host IPC authority. A file bind alone is insufficient when atomic replacement would leave a reader on an old inode. Before accepting version 3 for new native capability, check native read-only mount evidence on the held projection descriptor (`os.fstatvfs(fd).f_flag & os.ST_RDONLY` in the Python consumer); numeric ownership/mode or a caller flag does not establish this. Refuse a writable or indeterminate channel. This check proves the current channel, not an arbitrary executable; the verified cohort and alias guard remain required.

The declaration supplies no owner identity, approval, task creation, execution or delivery proof. It does not assert inspection of an arbitrary agent executable. Verify the actual compatible host and MCP images, all consumers and retired old SDK sessions through the ordered rollout before enabling native selection. Use only the fixed host projection and actual runtime context; no caller path, role or capability selector.

## Visibility and Context

- Main sees all task records; trusted groups see their own; untrusted groups receive no task snapshot.
- Only main receives registered-group records; other trusted groups receive an empty group array and untrusted groups receive no projection.
- The host supplies `NANOCLAW_CHAT_JID`; its SDK context supplies `NANOCLAW_GROUP_FOLDER` and `NANOCLAW_IS_MAIN` from the registered group.
- Prechecks may run before SDK-only context exists; use only the host's version-1 registered-group projection for their folder lookup.
- Never synthesize role variables or derive human identity, owner approval or tool authority from a snapshot.

## Reader and Effect Proof

- Accept legacy task arrays with record versions 0/1, unchanged version-2 envelopes and complete version-3 envelopes read-only; refuse unsupported versions and malformed, partial, linked or concurrently changed gate input.
- Match an envelope's receiving `group_folder` to actual host-derived context; preserve Main-all, trusted-own and untrusted-none filtering.
- Require actual version-2/3 `schedule_timezone` for zone proof; legacy records never establish it.
- Require both `generated_at` and stable file freshness at least as new as the scheduling operation before accepting version-2/3 effect readback.
- Publish each complete snapshot atomically with normalized agent ownership and private permissions before exposing bytes; preserve structural ancestors and unrelated paths.
- Require explicit version 1 for group context; missing versions supply no registered-scope proof.
- Require a supported version-1/2/3 record, the exact own task id/group, active status, schedule, isolated context, script and prompt before accepting an isolated watcher binding.
- Verify snapshot freshness against the actual scheduling attempt or binding before effect readback.
- A fresh complete absence after that operation can confirm no task remains without issuing another cancellation.
- After issuing native cancellation, require fresh authoritative removal before reporting that operation successful.
- Native own-task cancellation uses `{type: "cancel_task", taskId}`; host `src/ipc-handlers/tasks.ts` derives authorization from the source folder, never caller-supplied role flags.
- These projections grant no write or migration access to the underlying host database.

## Accepted Native Dispatch Metadata

The existing host `ContainerInput.taskOccurrence` has exactly `taskId` and canonical UTC `scheduledFor`. Forward that same host scheduling metadata to prechecks through `nativeContextEnv` as `NANOCLAW_TASK_OCCURRENCE`, matching its existing MCP use. Missing or malformed metadata supplies no accepted dispatch basis. Never manufacture environment values or treat them as a role, owner approval, send acknowledgment or effect attestation.

A native floating once precheck matches its immutable reminder/task contract against complete fresh version-3 readback: the same native id, local timezone, once wall time, prompt/script/context and the host's pre-dispatched completed row whose retained `next_run` equals `scheduledFor`. Evaluate its accepted due instant in UTC and use the existing durable once claim. Do not repeat hourly fallback's current-zone eligibility check after native dispatch; a timezone change after dispatch must not permanently discard the one-shot. Preserve unknown outcomes, existing claims and no-replay cancellation/mirror handling.

For native recurring dispatch, keep `taskOccurrence` unchanged. A separate optional `ContainerInput.taskDispatch` has exactly integer `schema_version: 1`, the same `taskId`, canonical UTC `scheduledFor` and valid IANA `timezone`. Capture the actual effective scheduling zone in the same synchronous eligibility decision before pre-advance/enqueue; preserve it through queueing and awaits. Never infer an old dispatch zone from UTC or a later timezone read. Forward this record as `NANOCLAW_TASK_DISPATCH`; omit absent legacy metadata and clear inherited values before forwarding actual host context. Malformed present metadata refuses.

A native cron precheck requires matching occurrence/dispatch coordinates and fresh complete own row-3 readback with the immutable cron/local/context/script/prompt contract. Derive its logical date from accepted `scheduledFor` in captured `timezone`, then use the existing locked date-occurrence claim. Do not retag the date or run hourly fallback eligibility against a later current timezone. Missing, historical unbound or mismatched metadata holds without guessed fallback, reset or effect replay. The scheduling declaration does not replace these bindings.

This metadata does not prove a live owner request, historical timezone transition, send or delivery. Keep those acceptance claims separate. Existing fallback and pinned entries retain their original versions and behavior; no automatic conversion, rekey, migration or reset is authorized.

## Terminal Cancellation Readback

- Native `cancel_task` accepts `task_id` and optional `request_id`.
- Retain the actual attempt id in its returned JSON.
- Request identities follow `TASK_CANCEL_REQUEST_ID` in host-owned `src/task-cancel-result.ts`; the co-shipped MCP reader is `container/agent-runner/src/task-cancel-result.ts`.
- The host writer is `src/ipc-handlers/tasks.ts`; `docs/task-cancellation-results.md` owns the complete schema, compatibility and failure semantics.
- Schema 1 has exactly `schema_version`, `request_id`, `task_id`, `outcome` and UTC `observed_at`.
- Outcomes are `cancelled`, `absent`, `failed`, `denied` and `uncertain`; only a correlated terminal `failed` result supplies definite non-application proof for recovery.
- Require fresh complete task readback at least as new as `observed_at`, the same own id/group and exact intended schedule/context/script/prompt before recording one new cancellation attempt.
- A valid active, paused or completed own task may be cancelled; isolated scheduling admission still requires active status.
- Task presence, queue acknowledgment, timeout, denial or uncertain output never permits automatic replay.
- A receipt supplies no operator identity, approval, cross-group access or task-database write authority.
- Runtime host and MCP readers deploy together.
- Preserve old fire-and-forget IPC clients.
- Regression coverage: host `src/ipc-auth.test.ts` and `container/agent-runner/src/task-cancel-result.test.ts`; consumer `jbaruch/nanoclaw-admin` `tests/test_watcher_workflow.py`.

## Rollout and Verification

- Publish and install this authority before enabling cross-plugin consumers.
- First publish compatible Admin readers for legacy arrays and envelopes 2/3, reminder entry readers for retained versions and the new native version, and the matching Host authority.
- Ship Core's compatible agent reader and existing dispatch-metadata forwarding while the host still writes legacy arrays. Canonically deploy this compatibility cohort and retire old SDK sessions before activating envelope 3.
- Then ship and deploy the host envelope-3 writer and actual zone projections. Verify actual installed reader/writer bytes, scope, fresh empty/nonempty version-3 envelopes and matching MCP support before native selection.
- Publishing a reader or merely building an image does not retire an old live reader. Preserve old-version support through the rollout window.
- New native reminder entry versions activate only with the supported native declaration. Compatibility fallback and pinned writers keep their existing versions; preserve every retained entry and uncertainty gate.
- Do not use a probe task, forged role/environment, live timezone change or manufactured owner decision to satisfy rollout proof. Real task effects and owner interaction require their own authorized acceptance.
- Keep a new producer inactive when its required proof is unavailable; never invent missing context or versions.
- Regression coverage: `jbaruch/nanoclaw` `src/group-snapshots.test.ts` and `container/agent-runner/src/format-task-row.test.ts`; watcher consumer coverage lives in `jbaruch/nanoclaw-admin` `tests/test_watcher_workflow.py`.
