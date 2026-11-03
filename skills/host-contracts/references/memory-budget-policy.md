# Memory Budget Provider Contract

## Owner and Scope

Host runtime `jbaruch/nanoclaw` owns canonical memory counting and CommonMark section boundaries. Installed authority `jbaruch/nanoclaw-host` `rules/memory-budget-policy.md` covers its fixed image lookup and versioned metadata contract for the `jbaruch/nanoclaw-admin` memory-diet and memory-hygiene skills.

The runtime co-ships these reviewed artifacts in its host/agent images:

- `container/shared/memory-budget-cli.mjs`
- `container/shared/memory-budget-policy.mjs`
- `container/shared/memory-budget-policy.json`

The immutable agent copies live together under `/app/shared/`, owned by the image rather than the agent. The host uses the same source artifacts. The policy JSON is schema 1; `parseMemoryBudgetPolicy` owns its exact fields and bounds. No reader maintains a second heading list, budget threshold or Markdown parser.

## Fixed Lookup and Input

- The admin reader invokes only `node /app/shared/memory-budget-cli.mjs` with no arguments.
- Caller data cannot select an executable, policy path, provider root or replacement parser.
- Supply the exact group `MEMORY.md` UTF-8 bytes on stdin, preserving BOM, CRLF and Unicode.
- The helper bounds input through the canonical policy's `max_source_bytes` before analysis.
- The helper reads only its co-shipped sibling policy/module and does not modify memory, references, policy or jobs.
- Before live use, verify the artifact and its parent cannot be written or renamed by the actual agent identity. A source fixture or copied writable helper is not deployed image evidence.

## Output Schema 1

Exit 0 emits one JSON object and a newline, with these exact fields and no memory content:

| Field | Contract |
| --- | --- |
| `schema_version` | Integer 1 |
| `policy_schema_version` | Integer 1 |
| `policy_sha256` | Lowercase SHA-256 of the exact co-shipped policy bytes |
| `total_chars` | Nonnegative Unicode-scalar count of the complete input |
| `counted_chars` | `total_chars` minus the complete exempt-section counts |
| `budget` | Positive integer from the canonical policy |
| `section_max_chars` | Positive integer from the canonical policy |
| `exempt_sections` | Array of `{heading, chars}` records, with string names and nonnegative scalar counts |
| `sections` | Array of `{heading, chars, body_chars, exempt}` records; heading is a string, counts are nonnegative integers, `body_chars <= chars`, and `exempt` is Boolean |

Section names and exemption decisions come from the common host parser. Whole exempt sections stay verbatim in live memory, never become extraction/retirement selectors, and contribute only neutral growth metadata. Fences, quotes, lists and HTML do not become top-level selectors. Raw total size still includes exempt content.

An unavailable sibling, unsupported policy/version, oversized input, malformed UTF-8 or analyzer failure exits nonzero, emits no usable stdout and writes an actionable safe stderr diagnostic. Consumers discard partial/invalid output, report unknown budget as one validation issue, and preserve source memory. Never infer an empty exemption set or a clean budget from failure.

## Memory Diet

The admin `memory-diet` skill runs only on an explicit main-group request. The main agent measures MEMORY.md with this helper, moves chosen incident sections verbatim into `memory/incidents/` reference files, and leaves each heading with a one-line lesson and a link. Exempt sections are never chosen. The helper's metadata grants no memory-write authority; the owner's request does. The host's job-based extraction (plans, results, private journals) is retired.

## Regression Coverage

- `jbaruch/nanoclaw` `src/memory-budget-policy.test.ts`: actual co-shipped CLI/module lookup, UTF-8/BOM/CRLF/scalar accounting, metadata-only stdout, missing/future siblings and invalid-input refusal.
- `jbaruch/nanoclaw-admin` `tests/test_memory_hygiene.py`: fixed command lookup, complete schema-1 output validation and unknown-budget refusal without source mutation.
- Native acceptance uses the composed actual-agent fixture and the rebuilt image; local fixtures do not replace that deployment check.
