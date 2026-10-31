# Sessionize rendered capture host-v1

## Authority and lookup

`jbaruch/nanoclaw-host` owns the script
`skills/host-contracts/scripts/sessionize-capture.mjs`, this complete reference and
the declared `rules/sessionize-rendered-capture.md` marker
`sessionizeCaptureContract: sessionize-rendered-capture-host-v1`.

A consumer, including `skills/cfp-submissions/**`, resolves only the current normal
installed provider through the supported project registry. Verify its manifest
identity `jbaruch/nanoclaw-host`, declaration of this rule, exact marker and complete
reference, then read the contained regular script from the same installed root.
Do not accept caller paths, source checkouts, provider overrides, fabricated role
variables or a model-authored replacement. An unprojected host-only Skill is not a
reason to invent a Skill invocation; read the complete actual installed provider
and its reference through the supported read route. Missing, denied, changed or
unsupported authority is an explicit unavailable capture, never an empty import.

The consumer may execute the exact verified JavaScript bytes as a Node ES module
and invoke its exported `capture()` with no arguments. The module imports only
Node standard libraries and never reopens its provider root or a relative module.
Do not rewrite the script, splice caller code into it, pass dependency callbacks
or substitute any runtime endpoint. Its direct CLI is:

```text
node <verified-installed-host-root>/skills/host-contracts/scripts/sessionize-capture.mjs
```

The resolved root above belongs to the installed registry, never task input.
Installed script identity and bytes must still match the verified provider at
execution; consumers retaining source bytes execute those same captured bytes.

## Preconditions and effects

The script invokes exactly the installed native validator:

```text
node /usr/local/lib/nanoclaw/validate-visible-browser.mts
```

It requires successful exact availability output. Only the actual host-injected
main private browser is eligible. Missing capability requires restoring that
installed image/service and genuine main attachment, never caller-set roles,
`.env` injection, raw endpoints, alternate browsers or credential exports.

This fixed endpoint is the NanoClaw private relay, not unredacted Chromium CDP.
For ordinary existing targets, its Page/Target document URL metadata is projected
to the origin, including the root-frame URL. Runtime location readback remains
the actual document route. The maintained Core owners are `projectPageTarget` in
`container/visible-browser/read-guard-metadata.mts` and its caller in
`container/visible-browser/cdp-read-broker.mts`. Capture requires this projected
protocol shape and independently verifies the exact route in Runtime. Raw-CDP
metadata is unsupported and holds; it never selects another endpoint or relaxes
the metadata boundary. The programmatic protocol fixtures cover both shapes.

Auto-skipped rendering is checked through the native `checkVisibility` option
on an existing descendant before reading an auto wrapper's contents. A wrapper's
own box does not prove that its contents are painted. Missing descendant/API/option
support or an inconclusive read holds the complete capture instead of returning
an empty subtree. No DOM witness is created and no scroll, activation or forced-
layout fallback is permitted. The bounded witness and tree logic belong to
`readRenderedTree` in the script.

The owner requires one unique existing Sessionize-origin page and confirms its exact
My Events route inside the isolated runtime read. Multiple origin candidates hold;
the owner never traverses candidates to find an account. The page may be in the
background; layout-hidden elements remain excluded without activating the UI. It does
not create, close, navigate or activate a target. It does not read form values,
input values, cookies, storage, profiles or credentials, and never clicks, edits,
submits or changes filters. It attaches one owned inspector session, captures the
rendered tree in a fixed isolated world, checks the same native target, context
and committed root-frame/loader before and after, verifies the exact route and
document time origin in the same isolated execution context, detaches its session and closes
only its connection. Missing, ambiguous, truncated, changed or uncertain
read/cleanup state holds visibly. There is no automatic retry or cadence.

The complete runtime predicates and bounds belong to `capture`,
`readRenderedTree`, `discovery`, `connect` and the named constants in the script;
consumers must use its returned tree unchanged, not rebuild rows or statuses.

## Output and refusal

Successful CLI exit0 emits exactly one JSON object and newline. The async
`capture()` returns the same object:

```json
{
  "schema_version": 1,
  "source": "sessionize",
  "observed_at": "2020-01-01T00:00:00.000Z",
  "capture": {
    "schema_version": 1,
    "origin": "https://sessionize.com",
    "path": "/app/speaker/events",
    "title": "the actual rendered page title",
    "nodes": [{"tag": "BODY", "parent": null, "classes": "", "text": ""}],
    "scope": "the actual capture scope and exclusions"
  }
}
```

Each preorder node carries its direct visible `text`, `tag`, `classes` and parent
index (root null; otherwise an earlier index). An eligible contained reference
may add `href`; an excluded anchor adds `link_omitted:true`. Query, fragment,
edit/control and unrelated links never become accepted references by stripping
parts. Forms and hidden contents are excluded. A visibility-hidden BODY is retained
only as a non-value structural root (empty text/classes, no link) when a descendant
supplies nonempty eligible visible text. Structural or image-only ambiguity holds
the capture. Direct text is eligible only with a supported positive computed font
size and nontransparent native text fill (SVG fill for SVG text). Known zero-size
or transparent text contributes no text, while child overrides remain eligible.
Unsupported paint values or ambiguous shadow/stroke alternatives hold; this is a
conservative supported-style boundary, not universal pixel-rendering proof. The
exact predicates belong to `eligibleText` and `alpha` inside `readRenderedTree`.
Other visibility-hidden nodes contribute no values. Captures are private source input,
not public fixtures or another persistent store; retain no private payload in
logs, source or chat. The owner has no file writer or caller output-path input.

`observed_at` is the actual read clock, not a submission/source time. Title,
account marker, filter, count and statuses are observations, not manufactured
account authentication or exhaustive coverage. The Conferences parser validates
the observed account/filter/count/native relationships and classifies all unknown
status/date/history coverage. Native collection and semantic completeness are
separate: a successful read never proves all account history or absent submissions.

Failure exits1 with empty stdout and fixed actionable stderr. Async failures
reject; the caller must report unavailable/unknown and preserve existing state.
No fallback capture, replay, account repair or source mutation is authorized.
The CLI outer boundary redacts unexpected protocol/page/process payloads as well
as ordinary holds. Cleanup uncertainty is a refusal, never a successful capture.

## Rollout and verification

Publish and confirm this provider normally before the Conferences consumer's
trusted-base prerequisite selects it. Verify the normal installed manifest, rule,
full reference and script bytes before consumer source gates/native acceptance.
Node programmatic DOM/transport/validator tests are the repository gate, not proof
of current signed-in access or real account history. Root owns native validation:
use only the genuine existing main capability/page, verify unchanged tab inventory
and authentication plus complete exact output/consumer parsing, and preserve any
refusal. No new test target, task, profile or account operation is implied.
