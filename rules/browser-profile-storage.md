---
alwaysApply: false
applyTo: "** — when implementing, operating or using authenticated browser persistence, changing or testing the dedicated browser, its agent validator or private CDP relay, or directing or using the rack Mini Screen Sharing handoff"
---

# Browser Profile Storage

## Required Read

- Before changing, testing or using the dedicated browser, its authenticated profile, agent validator or relay, read `skills/host-contracts/references/browser-profile-storage.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Only literal main may control the private browser bridge. Keep the plain private profile folder out of agent mounts, logs, every Git repository and all backups, including Time Machine. Never expose CDP, export credentials or clear authentication on routine deployment. Hand MFA to the operator.
- Keep the native agent validator and main-only access checks on every consumer PR. Keep the Chromium smoke test until the reviewed Mini cutover.
- At cutover the consumer must validate the unmodified shipped config with `nginx -t` in the Compose-pinned nginx image. Prefer starting it unchanged. The binding reference permits only one strictly checked upstream change to synthetic loopback in a disposable test copy. In either case require real unprivileged, read-only startup in the same image and isolated HTTP discovery rewrite and WebSocket upgrade and echo checks.

## Rack Mini Operator Handoff

- Apply the Rack Mini Operator Handoff section of the binding reference when the owner uses native macOS Screen Sharing on the rack Mini.
- Require its current-state acceptance before directing an operator to that path.
- Every other deployment uses its existing approved device and identity path.
