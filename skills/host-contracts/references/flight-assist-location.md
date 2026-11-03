# Flight-Assist Location Snapshot

## Owner and Schema

- `jbaruch/nanoclaw` owns `current-location.json` through `src/host-plugins/flight-assist-location.ts` and its registered sink in `src/host-plugins/flight-assist-location-sink.ts`.
- The host path is `<DATA_DIR>/state/<group.folder>/flight-assist/current-location.json`.
- The group container reads `/workspace/state/flight-assist/current-location.json`.
- Schema version is plain integer `1`, independent of the travel plugin's flight-state schema.

| Field | Required type and value |
|---|---|
| `schema_version` | Integer `1`; booleans are invalid |
| `latitude` | Finite number in `[-90, 90]`; booleans are invalid |
| `longitude` | Finite number in `[-180, 180]`; booleans are invalid |
| `captured_at` | RFC 3339 UTC string with `Z` or zero offset |

## Writer

- Emit a complete record only for a registered group's location event whose sender matches `ASSISTANT_OWNER_TG_USER_ID`.
- Publish records atomically through a temporary file and rename.
- Preserve agent ownership and private modes under `rules/agent-file-permissions.md`.
- The host alone changes the schema; each owner location write replaces the prior record with the complete current shape.

## Readers

- `jbaruch/nanoclaw-travel` reads through `skills/flight-assist/state.py`; readers never migrate or write this host artifact.
- `jbaruch/nanoclaw-admin` reads through `skills/place-reminders/scripts/places.py` with a 10-minute freshness window, for reminders tied to arriving at or leaving a place.
- Treat missing, unreadable, malformed, unsupported-version or invalid-field records as no usable snapshot.
- Apply the caller's freshness window and reject future capture times before using coordinates for routing or airport-presence suppression.
- Absence of a usable fresh fix proves neither airport presence nor absence.
- Coordinate schema changes with consuming readers under `coding-policy: stateful-artifacts`.
- Keep precise location values out of shared diagnostics.
