# Read-only vehicle morning summary

Contract: tessie-morning-brief-host-v1

## Owner and admission

Core `src/host-plugins/tessie-brief/` owns the deterministic aggregate. The fixed
Tesla adapter and optional Admin morning gather consume it. The complete existing
`tessie-host-authority.md` and `tessie-calendar-charge.md` constraints apply.
This is a read-only use of existing owner authorization, not a new grant, policy
flag, enrollment or cadence. No new store or database schema exists.

Native task type `tessie_brief_request` requires the actual unique registered
Telegram Main source and a protected Tessie owner. Recheck current registry,
protected policy and native home after I/O. Resolve current non-archived admitted
vehicles dynamically, with an end-of-read fleet identity/alias check. No hardcoded
VIN list, caller identity, role, date, timezone, route or readiness flag exists.
The handler requires the complete declared installed Host and Tesla contracts,
including the regular co-shipped transport closure. Missing or unsupported
contracts hold without another provider route.

## Exact wire and output

Payload is exactly `{schema_version:1,operation:"summary"}`. Native request IDs,
source directory, session and bounded script replies use the existing IPC owner.
The unchanged native reply wrapper has schema1 and status/data or a fixed safe
error. No arbitrary provider prose, credentials or private paths cross it.

Data has exactly integer `schema_version:1`, paired `day` and `home_timezone`,
canonical UTC-millisecond `observed_at`, integer
`checked_vehicles` (0–100), `coverage` (`complete` or `partial`),
`uncovered_sources`, and `vehicles`. Every current admitted vehicle contributes
one `{alias,alerts,unknown_checks}` row. Aliases are bounded unique native text;
no VIN, coordinate, saved-home label or Calendar body/identity is exported.

Each alert is exactly `{kind,detail}` for a proved condition. Unknown checks are
separate finite condition names; they are never fabricated healthy results.

| Kind | Exact detail |
| --- | --- |
| `overnight_unplugged` | `battery_percent` (0–100), integer `daily_limit_percent` (50–100), integer `samples` (2–1200), canonical UTC `start` and `end` |
| `insufficient_charge` | positive finite `shortfall_kwh`, `expected_departure_percent` (0–100), integer `required_percent` (0–100), integer `drive_count` (1–2000) |
| `tire_warning` | unique nonempty `positions` from `front_left`, `front_right`, `rear_left`, `rear_right` |
| `open_vehicle_alert` | exact `flags:["not_enough_power_to_heat"]` for the documented current native warning |

The adapter validates the entire data object before adding deterministic literal
`lines`, one combined line per vehicle with at least one proved condition. Its
process output is exactly `{wake_agent:false,data}`. No separate vehicle notice
is sent. Missing/invalid/stale evidence stays explicit; zero lines is not a claim
that every physical vehicle is healthy when coverage is incomplete.

## Sources and no-effect boundary

Use only the existing normal Main OneCLI route and fixed Tessie broker GETs.
Preserve provider cache defaults. No wake, uncached read, direct HTTP/key path,
control, charging poll, command/notice intent, journal update or notification
exists in the aggregate. Only existing IPC transport request/reply files are
written. Private policy and charging gates are not rewritten or migrated.

Health reads use cached state/location/tire observations. Today’s remaining
managed drives use the same native home clock (`tz_state` schema4 `home_tz`),
complete bounded Calendar metadata, vehicle mappings, measured capacity and
consumption, route-distance owner and charging forecast as #2. Existing protected
enrollment2 provides the relevant planning/home/baseline data; it is not inferred
or provisioned here. Without those inputs, dependent checks are unknown while
independently proved vehicle warnings remain available. A still-running drive,
unknown mapping, partial calendar or unknown power never becomes an empty day or
invented departure charge. No rated-range fallback exists.

The overnight check uses real stored historical samples, not today's snapshot or
idle/no-charge as a substitute for disconnected continuity. Fixed history is
owner-only GET `/<VIN>/states`, exact `from`, `to`, `interval:"120"`,
`condense:"false"`. Per the first-party API, interval is SECONDS; 120 is two-minute
sampling, while 1 requests all points. The native prior home evening-to-current
window is at most 18 hours. No caller interval, timezone, format, field selection,
cache bypass or arbitrary history range is accepted by the summary operation.

Only this exact history GET receives a fixed 8 MiB network response cap; every
other broker route retains its existing 1 MiB cap. The documented API offers no
field filter. At most 1200 complete rows are admitted, accommodating the full
18-hour/two-minute window and its boundary samples. Histories are processed one
vehicle at a time and released; no full-fleet history collection is retained.
Oversize, malformed, missing endpoints or gaps over 15 minutes stay unknown.
Realistic full-record source fixtures cover the complete window.

Require a recent current disconnected/below-baseline home observation and real
historical disconnected/parked positions bound to that native saved home. At
least four hours of bounded overnight observations are necessary. Report only
“stored overnight observations show…” evidence. These observations do not prove
an unobservable plug/unplug or trip between samples. No physical omniscience or
new geofence is claimed.

## Current warning and firmware capability limit

The exact cached `charge_state.not_enough_power_to_heat` boolean is documented
by Tesla's Available Data as battery power insufficient for heating. A true fresh
flag is a current vehicle warning. False or missing never supplies generic
firmware-alert coverage. Positional tire warnings use documented native low
status, never a guessed pressure threshold.

Tessie's `firmware_alerts` endpoint contains generated alert history with
`timestamp`, `name`, `description`, `recent_fleet_count`; no open/cleared state is
declared. A recent historical row or an available software update is never
relabeled an open alert. The result retains
`uncovered_sources:["firmware_active_status"]` and partial coverage. This source
release does not satisfy the original general still-open firmware criterion by
pretending it is supported. It registers no Fleet Telemetry configuration,
subscription or separate persistent alert store. The owner/runtime disposition
of that capability limit remains separate and the issue stays open.

Primary sources: Tessie [historical states](https://developer.tessie.com/reference/get-historical-states),
[tire pressure](https://developer.tessie.com/reference/get-tire-pressure),
[firmware history](https://developer.tessie.com/reference/get-firmware-alerts),
and Tesla [available data](https://developer.tesla.com/docs/fleet-api/fleet-telemetry/available-data).

## Source order and native acceptance

Publish/install this Host authority first. Merge the complete Core producer
before publishing the Tesla adapter and Admin optional consumer. This is a new
read-only family; incumbent requests/policy/gates retain their exact formats.
The new Core handler holds until the matching actual declared providers and
transport files are installed. No stale consumer can supply a readiness flag.

Admin owns a versioned gather projection and its continuation/completion reader;
old manifest formats remain read-only compatible through its finite transition.
Root installs those matching readers and retires old SDK generations before a
normal new gather writes the new manifest format. Preserve all older brief,
mail, reminder, claim and pending-selection history; no blanket reset occurs.

Deterministic tests cover the supported conditions, contrary/unknown evidence,
all-clear silence, cached sleeping reads with zero wake/POST/control/notice
methods, privacy, full history bounds and actual installed-shape gather plus
completion. Root separately verifies actual installed bytes, genuine allowed and
denied context, native cached evidence/no-wake behavior and a normal brief.
Source publication claims no native vehicle, cadence, generic firmware coverage,
message delivery or original issue closure.

When the protected native home is expectedly missing or invalid, both `day` and
`home_timezone` are null. Otherwise they are a real home-local `YYYY-MM-DD` and
valid native IANA home zone. Half-null pairs refuse. Null home requires overnight
and drive-energy coverage unknown for every vehicle; independently proved tire
and current warnings survive. Never substitute UTC, travel zone or enrollment.
Unexpected storage/implementation errors abort; home appearance or change during
I/O invalidates the entire snapshot.

The host data cap is 128 KiB. The fixed adapter envelope including deterministic
lines and the Admin saved packet each have a 256 KiB cap, covering the complete
100-vehicle fleet with all supported conditions and bounded native aliases.
No caller can choose a cap. Existing ordinary transport limits remain unchanged.
