---
alwaysApply: false
applyTo: "** — when implementing, operating or using authenticated persistence for the dedicated browser, or directing or using the rack Mini Screen Sharing handoff"
---

# Browser Profile Storage

## Required Read

- Before implementing, operating or using authenticated persistence or the dedicated browser, read `skills/host-contracts/references/browser-profile-storage.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Only literal main may control the private browser bridge. Keep the plain private profile folder out of agent mounts, logs and backups. Never expose CDP, export credentials or clear authentication on routine deployment; MFA stays with the operator.

## Rack Mini Operator Handoff

- Apply the Rack Mini Operator Handoff section of the binding reference when the owner uses native macOS Screen Sharing on the rack Mini.
- Require its current-state acceptance before directing an operator to that path.
- Every other deployment uses its existing approved device and identity path.
