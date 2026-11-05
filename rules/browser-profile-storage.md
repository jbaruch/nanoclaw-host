---
alwaysApply: false
applyTo: "container/visible-browser/**, container/skills/visible-browser/**, src/visible-browser*, docker-compose.yml, scripts/deploy.sh, skills/watchers/** — when implementing, operating or using authenticated persistence for the dedicated browser"
---

# Browser Profile Storage

## Required Read

- Before implementing, operating or using authenticated persistence or the dedicated browser, read `skills/host-contracts/references/browser-profile-storage.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Only literal main may control the private browser bridge. Keep the plain private profile folder out of agent mounts, logs and backups. Never expose CDP, export credentials or clear authentication on routine deployment; MFA stays with the operator.

## Tab cleanup

- Whenever browser work shows open tabs, close those outside the pinned services listed in the native `visible-browser` skill. Keep one tab per pin and reuse it.
- Close temporary task tabs when finished, including on failure. Apply the same cleanup to leftovers from earlier work.
- Preserve the marked browser health tab. This is ordinary browser work, not a scheduled sweeper.
